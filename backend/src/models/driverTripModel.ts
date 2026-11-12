import type { PoolClient } from "pg";
import { pool } from "../db";
import { DomainError } from "../utils/serviceUtils";
import { transaction } from "../utils/transaction";
import { authorizeTripActor } from "./tripAuthorization";
import { transitionInTransaction } from "./tripModel";
import type {
  DriverTripCapture,
  DriverTripQuery,
} from "../middleware/validations/schemas/driverTripSchema";

const select = `SELECT v.id,v.veiculo_id,v.motorista_id,v.status,v.km_inicial,v.km_final,
  v.data_inicio,v.data_fim,v.criado_em,v.qtd_passageiros_obitos,
  c.placa,c.identificacao,c.modelo,c.quilometragem,c.tipo_combustivel,
  s.categoria,s.flag_urgencia,s.data_necessidade
  FROM viagens v JOIN veiculos c ON c.id=v.veiculo_id
  LEFT JOIN solicitacoes s ON s.id=v.solicitacao_id
  JOIN usuarios u ON u.motorista_id=v.motorista_id
  JOIN motoristas m ON m.id=u.motorista_id
  WHERE u.id=$1 AND u.ativo AND u.deletado_em IS NULL AND m.ativo AND m.deletado_em IS NULL`;
const activeOrder = `CASE v.status WHEN 'Em andamento' THEN 0 WHEN 'Em deslocamento' THEN 1 WHEN 'Agendada' THEN 2 ELSE 3 END,
  CASE WHEN v.status='Agendada' THEN COALESCE(s.data_necessidade,v.criado_em) END ASC NULLS LAST,
  CASE WHEN v.status<>'Agendada' THEN COALESCE(s.data_necessidade,v.criado_em) END DESC, v.id`;

const list = async (userId: string, query: DriverTripQuery) => {
  const { rows } = await pool.query(
    `WITH own AS (${select}), page AS (
    SELECT * FROM own ORDER BY CASE status WHEN 'Em andamento' THEN 0 WHEN 'Em deslocamento' THEN 1 WHEN 'Agendada' THEN 2 ELSE 3 END,
    CASE WHEN status='Agendada' THEN COALESCE(data_necessidade,criado_em) END ASC NULLS LAST,
    CASE WHEN status<>'Agendada' THEN COALESCE(data_necessidade,criado_em) END DESC,id LIMIT $2 OFFSET $3
  ) SELECT (SELECT COUNT(*)::int FROM own) AS total,
    COALESCE((SELECT jsonb_agg(p ORDER BY CASE p.status WHEN 'Em andamento' THEN 0 WHEN 'Em deslocamento' THEN 1 WHEN 'Agendada' THEN 2 ELSE 3 END, CASE WHEN p.status='Agendada' THEN COALESCE(p.data_necessidade,p.criado_em) END ASC NULLS LAST, CASE WHEN p.status<>'Agendada' THEN COALESCE(p.data_necessidade,p.criado_em) END DESC,p.id) FROM page p),'[]'::jsonb) AS dados`,
    [userId, query.limite, (query.pagina - 1) * query.limite],
  );
  return { ...rows[0], pagina: query.pagina, limite: query.limite };
};
const get = async (
  userId: string,
  id: string,
  client: Pick<PoolClient, "query"> = pool,
) => {
  const { rows } = await client.query(`${select} AND v.id=$2`, [userId, id]);
  if (!rows[0])
    throw new DomainError(404, "Viagem não encontrada para sua conta");
  return rows[0];
};
const summary = async (userId: string) => {
  const driver = await pool.query(
    `SELECT m.id,m.nome FROM usuarios u JOIN motoristas m ON m.id=u.motorista_id
    WHERE u.id=$1 AND u.ativo AND u.deletado_em IS NULL AND m.ativo AND m.deletado_em IS NULL`,
    [userId],
  );
  if (!driver.rows[0])
    throw new DomainError(
      409,
      "Sua conta não está vinculada a um motorista ativo. Contate o gestor.",
    );
  const vehicles = await pool.query(
    `SELECT c.id,c.placa,c.modelo,c.quilometragem,c.tipo_combustivel,c.identificacao
    FROM veiculos c JOIN motoristas m ON m.id=$1 WHERE c.ativo AND c.deletado_em IS NULL
    AND (m.motorista_coringa OR EXISTS(SELECT 1 FROM motoristas_veiculos mv WHERE mv.motorista_id=m.id AND mv.veiculo_id=c.id)
      OR EXISTS(SELECT 1 FROM viagens v WHERE v.motorista_id=m.id AND v.veiculo_id=c.id AND v.status IN ('Agendada','Em deslocamento','Em andamento')))
    ORDER BY c.modelo,c.placa`,
    [driver.rows[0].id],
  );
  const active = await pool.query(
    `${select} AND v.status IN ('Agendada','Em deslocamento','Em andamento') ORDER BY ${activeOrder} LIMIT 1`,
    [userId],
  );
  return {
    motorista: driver.rows[0],
    veiculos: vehicles.rows,
    viagem: active.rows[0] ?? null,
  };
};

const capture = (
  userId: string,
  id: string,
  input: DriverTripCapture,
  type: "inicio" | "fim",
) =>
  transaction(async (client) => {
    await authorizeTripActor(client, userId, true);
    const simulated = "simulada" in input;
    if (
      simulated &&
      (process.env.ENABLE_PANEL_DEMO !== "true" ||
        process.env.NODE_ENV === "production")
    )
      throw new DomainError(
        403,
        "Simulação do painel desabilitada no servidor",
      );
    const photo = "foto" in input ? input.foto : null;
    // Uma conta só pode iniciar/finalizar uma viagem por vez.
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 741852))",
      [userId],
    );
    const { rows } = await client.query(
      `${select} AND v.id=$2 FOR UPDATE OF v`,
      [userId, id],
    );
    const trip = rows[0];
    if (!trip)
      throw new DomainError(404, "Viagem não encontrada para sua conta");
    const target = type === "inicio" ? "Em deslocamento" : "Finalizada";
    const previous = type === "inicio" ? "Agendada" : "Em andamento";
    const record = await client.query(
      "SELECT km,foto,simulada FROM viagens_registros_painel WHERE viagem_id=$1 AND tipo=$2",
      [id, type],
    );
    if (record.rows[0]) {
      if (
        trip.status === target &&
        record.rows[0].km === input.km &&
        record.rows[0].foto === photo &&
        record.rows[0].simulada === simulated
      )
        return get(userId, id, client);
      throw new DomainError(
        409,
        "Esta leitura já foi registrada. Atualize a viagem antes de continuar.",
      );
    }
    if (trip.status !== previous)
      throw new DomainError(
        409,
        `A viagem precisa estar ${previous} para registrar esta leitura`,
      );
    const vehicle = await client.query(
      "SELECT quilometragem FROM veiculos WHERE id=$1 AND ativo AND deletado_em IS NULL FOR UPDATE",
      [trip.veiculo_id],
    );
    if (!vehicle.rows[0])
      throw new DomainError(409, "O veículo não está ativo");
    if (
      input.km <
      Math.max(
        Number(vehicle.rows[0].quilometragem),
        Number(trip.km_inicial ?? 0),
      )
    )
      throw new DomainError(
        400,
        "A quilometragem não pode ser menor que a última leitura registrada",
      );
    if (type === "inicio") {
      const busy = await client.query(
        `SELECT id FROM viagens WHERE id<>$1 AND (veiculo_id=$2 OR motorista_id=$3)
      AND status IN ('Em deslocamento','Em andamento') LIMIT 1`,
        [id, trip.veiculo_id, trip.motorista_id],
      );
      if (busy.rows.length)
        throw new DomainError(
          409,
          "Motorista ou veículo já está em outra viagem ativa",
        );
    }
    await transitionInTransaction(
      client,
      id,
      { status: target },
      { userId, manager: false, ownOnly: true },
    );
    await client.query(
      `UPDATE viagens SET ${type === "inicio" ? "km_inicial" : "km_final"}=$2 WHERE id=$1`,
      [id, input.km],
    );
    await client.query(
      "INSERT INTO viagens_registros_painel (viagem_id,usuario_id,tipo,km,foto,simulada) VALUES ($1,$2,$3,$4,$5,$6)",
      [id, userId, type, input.km, photo, simulated],
    );
    await client.query(
      "UPDATE veiculos SET quilometragem=$2,atualizado_em=NOW() WHERE id=$1",
      [trip.veiculo_id, input.km],
    );
    return get(userId, id, client);
  });
export default { list, get, summary, capture };
