import type { PoolClient } from "pg";
import { TRIP_EVENTS, validateTransition } from "../domain/tripStatus";
import type { TripTransition } from "../middleware/validations/schemas/tripSchema";
import { DomainError } from "../utils/serviceUtils";
import { transaction } from "../utils/transaction";
import { authorizeTripActor } from "./tripAuthorization";
import { appendEvent } from "./outboxModel";

export type TripScope = { userId: string; manager: boolean };
type TripRow = {
  id: string;
  status: string;
  data_inicio: Date | null;
  data_fim: Date | null;
  atualizado_em: Date;
};

// Também é usada pelo cancelamento de solicitação, dentro da transação dele.
export const transitionInTransaction = async (
  client: PoolClient,
  id: string,
  input: TripTransition,
  scope: TripScope,
) => {
  // O escopo calculado antes de BEGIN não autoriza a gravação.
  scope = await authorizeTripActor(client, scope.userId);
  const trip = (
    await client.query<TripRow>(
      `SELECT v.id, v.status, v.data_inicio, v.data_fim, v.atualizado_em
       FROM viagens v
       WHERE v.id = $1 AND ($2::boolean OR EXISTS (
         SELECT 1 FROM usuarios u JOIN motoristas m ON m.id = u.motorista_id
         WHERE u.id = $3 AND u.ativo AND u.deletado_em IS NULL
         AND m.ativo AND m.deletado_em IS NULL AND m.id = v.motorista_id
       )) FOR UPDATE OF v`,
      [id, scope.manager, scope.userId],
    )
  ).rows[0];
  if (!trip) throw new DomainError(404, "Viagem não encontrada");
  if (!scope.manager && input.status === "Cancelada")
    throw new DomainError(403, "Somente um gestor pode cancelar a viagem");
  if (!validateTransition(trip.status, input.status)) return trip;
  if (input.status === "Cancelada" && !input.motivo?.trim())
    throw new DomainError(400, "Informe o motivo do cancelamento");

  const updated = (
    await client.query<TripRow>(
      `UPDATE viagens SET status = $2::varchar, atualizado_em = NOW(),
       data_inicio = CASE WHEN $2::varchar = 'Em deslocamento' THEN COALESCE(data_inicio, NOW()) ELSE data_inicio END,
       data_fim = CASE WHEN $2::varchar = 'Finalizada' THEN NOW() ELSE data_fim END
       WHERE id = $1 RETURNING id, status, data_inicio, data_fim, atualizado_em`,
      [id, input.status],
    )
  ).rows[0];
  await client.query(
    `INSERT INTO historico_status_viagem
     (viagem_id, status_anterior, status_novo, usuario_id, motivo)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, trip.status, input.status, scope.userId, input.motivo ?? null],
  );
  // Agendada é somente o estado inicial: nunca é destino de uma transição.
  const event = TRIP_EVENTS[input.status as keyof typeof TRIP_EVENTS];
  await appendEvent(client, "Viagem", id, event, {
    viagem_id: id,
    usuario_id: scope.userId,
    status_anterior: trip.status,
    status_novo: input.status,
    motivo: input.motivo ?? null,
    ocorrido_em: updated.atualizado_em,
  });
  return updated;
};

const transition = (id: string, input: TripTransition, scope: TripScope) =>
  transaction((client) => transitionInTransaction(client, id, input, scope));
export default { transition };
