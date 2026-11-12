import type { PoolClient } from "pg";

export const appendEvent = async (
  client: PoolClient,
  aggregateType: "Viagem" | "Obito",
  aggregateId: string,
  eventType: string,
  payload: Record<string, unknown>,
) => {
  await client.query(
    `INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [aggregateType, aggregateId, eventType, JSON.stringify(payload)],
  );
};
