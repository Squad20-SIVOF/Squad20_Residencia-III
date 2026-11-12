import type { PoolClient } from "pg";
import { pool } from "../db";
import { DomainError } from "../utils/serviceUtils";
import { transaction } from "../utils/transaction";
import { appendEvent } from "./outboxModel";
import type {
  DeathInput,
  DeathQuery,
} from "../middleware/validations/schemas/deathSchema";

export class DeathError extends DomainError {}

const detailColumns = `id, viagem_id, identificacao, local_recolhimento, documentacao,
  status_coleta, data_hora_recolhimento, motivo_cancelamento, cancelado_em`;

const list = async (query: DeathQuery, tripId?: string) => {
  if (tripId) {
    const trip = await pool.query("SELECT id FROM viagens WHERE id = $1", [
      tripId,
    ]);
    if (!trip.rows.length) throw new DeathError(404, "Viagem não encontrada");
  }

  // Identificação e documentação só são devolvidas na consulta de detalhe.
  const { rows } = await pool.query(
    `WITH filtered AS (
       SELECT id, viagem_id, status_coleta, data_hora_recolhimento, cancelado_em
       FROM obitos WHERE ($1::uuid IS NULL OR viagem_id = $1)
     ), page AS (
       SELECT * FROM filtered ORDER BY data_hora_recolhimento DESC NULLS LAST, id
       LIMIT $2 OFFSET $3
     )
     SELECT (SELECT COUNT(*)::int FROM filtered) AS total,
       COALESCE((SELECT jsonb_agg(p ORDER BY p.data_hora_recolhimento DESC NULLS LAST, p.id)
         FROM page p), '[]'::jsonb) AS dados`,
    [tripId ?? null, query.limite, (query.pagina - 1) * query.limite],
  );
  return { ...rows[0], pagina: query.pagina, limite: query.limite };
};

const get = async (id: string) =>
  (await pool.query(`SELECT ${detailColumns} FROM obitos WHERE id = $1`, [id]))
    .rows[0];

const checkCapacity = async (client: PoolClient, tripId: string) => {
  // O bloqueio da viagem serializa novas inclusões e transferências para ela.
  const trip = (
    await client.query<{ veiculo_id: string | null; status: string | null }>(
      "SELECT veiculo_id, status FROM viagens WHERE id = $1 FOR UPDATE",
      [tripId],
    )
  ).rows[0];
  if (!trip) throw new DeathError(404, "Viagem não encontrada");
  if (["Cancelada", "Finalizada"].includes(trip.status ?? ""))
    throw new DeathError(409, "A viagem está encerrada");
  if (!trip.veiculo_id)
    throw new DeathError(409, "A viagem precisa ter uma viatura do SVO");

  const vehicle = (
    await client.query<{ capacidade_maxima: number }>(
      `SELECT capacidade_maxima FROM veiculos
     WHERE id = $1 AND frota = 'SVO' AND ativo AND deletado_em IS NULL
     FOR SHARE`,
      [trip.veiculo_id],
    )
  ).rows[0];
  if (!vehicle)
    throw new DeathError(409, "A viagem precisa ter uma viatura ativa do SVO");

  const { rows } = await client.query<{ total: number }>(
    "SELECT COUNT(*)::int AS total FROM obitos WHERE viagem_id = $1 AND status_coleta <> 'Cancelado'",
    [tripId],
  );
  // RN01 define um teto mesmo quando a capacidade genérica do cadastro é maior.
  const capacity = Math.min(vehicle.capacidade_maxima, 4);
  if (rows[0].total >= capacity)
    throw new DeathError(409, "Capacidade da viatura atingida nesta viagem");
};

const save = (input: DeathInput, userId: string, id?: string) =>
  transaction(async (client) => {
    let previousStatus: string | undefined;
    if (id) {
      const current = (
        await client.query<{ viagem_id: string | null; status_coleta: string }>(
          "SELECT viagem_id, status_coleta FROM obitos WHERE id = $1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (!current) throw new DeathError(404, "Óbito não encontrado");
      previousStatus = current.status_coleta;
      if (current.status_coleta === "Cancelado")
        throw new DeathError(409, "Óbito cancelado não pode ser editado");
      const allowed =
        current.status_coleta === input.status_coleta ||
        current.status_coleta === "Pendente" ||
        (current.status_coleta === "Recolhido" &&
          input.status_coleta === "Concluído");
      if (!allowed)
        throw new DeathError(
          409,
          "A coleta não pode retornar a um status anterior",
        );
      if (current.viagem_id !== input.viagem_id)
        await checkCapacity(client, input.viagem_id);
      else {
        const trip = (
          await client.query<{ status: string }>(
            "SELECT status FROM viagens WHERE id = $1 FOR UPDATE",
            [input.viagem_id],
          )
        ).rows[0];
        if (!trip) throw new DeathError(404, "Viagem não encontrada");
        if (["Cancelada", "Finalizada"].includes(trip.status))
          throw new DeathError(409, "A viagem está encerrada");
      }
    } else {
      await checkCapacity(client, input.viagem_id);
    }

    const values = [
      input.viagem_id,
      input.identificacao,
      input.local_recolhimento,
      input.documentacao ?? null,
      input.status_coleta,
      input.data_hora_recolhimento ?? null,
    ];
    const result = id
      ? await client.query(
          `UPDATE obitos SET viagem_id = $1, identificacao = $2, local_recolhimento = $3,
           documentacao = $4, status_coleta = $5, data_hora_recolhimento = $6
           WHERE id = $7 RETURNING ${detailColumns}`,
          [...values, id],
        )
      : await client.query(
          `INSERT INTO obitos (viagem_id, identificacao, local_recolhimento,
           documentacao, status_coleta, data_hora_recolhimento)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${detailColumns}`,
          values,
        );

    const row = result.rows[0];
    if (
      input.status_coleta !== "Pendente" &&
      (previousStatus === undefined || previousStatus === "Pendente")
    ) {
      await appendEvent(client, "Obito", row.id, "ObitoColetado", {
        obito_id: row.id,
        viagem_id: input.viagem_id,
        usuario_id: userId,
        ocorrido_em: input.data_hora_recolhimento,
      });
    }
    return row;
  });

const cancel = async (id: string, motivo: string) => {
  const { rows } = await pool.query(
    `UPDATE obitos SET status_coleta = 'Cancelado', motivo_cancelamento = $2, cancelado_em = NOW()
     WHERE id = $1 AND status_coleta <> 'Cancelado'
     RETURNING id, viagem_id, status_coleta, motivo_cancelamento, cancelado_em`,
    [id, motivo],
  );
  if (rows[0]) return rows[0];

  const existing = await pool.query("SELECT id FROM obitos WHERE id = $1", [
    id,
  ]);
  if (!existing.rows.length) throw new DeathError(404, "Óbito não encontrado");
  throw new DeathError(409, "Óbito já cancelado");
};

export default { list, get, save, cancel };
