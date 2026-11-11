import model from "./tripModel";
import requestModel from "./requestModel";
import { pool } from "../db";

jest.mock("../db", () => ({ pool: { connect: jest.fn(), query: jest.fn() } }));
const id = "11111111-1111-4111-8111-111111111111";
const scope = { userId: "22222222-2222-4222-8222-222222222222", manager: true };
const at = new Date("2026-11-11T15:00:00Z");
let status: string;
let failure: string | undefined;
let query: jest.Mock;
let release: jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  status = "Agendada";
  failure = undefined;
  query = jest.fn(async (sql: string, values?: unknown[]) => {
    if (failure && sql.includes(failure)) throw new Error("Falha simulada");
    if (sql.includes("FOR UPDATE OF v")) return { rows: [{ id, status }] };
    if (sql.startsWith("UPDATE viagens")) {
      status = values?.[1] as string;
      return { rows: [{ id, status, atualizado_em: at }] };
    }
    if (sql.includes("FROM solicitacoes") && sql.includes("FOR UPDATE"))
      return { rows: [{ id, status: "Agendada" }] };
    if (sql.includes("FROM viagens WHERE solicitacao_id"))
      return { rows: [{ id, status }] };
    if (sql.startsWith("UPDATE solicitacoes"))
      return { rows: [{ id, status: "Cancelada" }] };
    return { rows: [] };
  });
  release = jest.fn();
  (pool.connect as jest.Mock).mockResolvedValue({ query, release });
});

test("grava alteração, histórico e evento antes do commit", async () => {
  await model.transition(id, { status: "Em deslocamento" }, scope);
  const calls = query.mock.calls as [string, unknown[]?][];
  expect(
    calls
      .map(([sql]) => sql)
      .filter((sql) => /UPDATE viagens|INSERT INTO/.test(sql)),
  ).toHaveLength(3);
  expect(calls[0][0]).toBe("BEGIN");
  expect(calls.at(-1)?.[0]).toBe("COMMIT");
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining("FOR UPDATE OF v"),
    [id, true, scope.userId],
  );
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining("INSERT INTO historico_status_viagem"),
    [id, "Agendada", "Em deslocamento", scope.userId, null],
  );
  const event = calls.find(([sql]) =>
    sql.includes("INSERT INTO outbox_events"),
  )![1]!;
  expect(event.slice(0, 3)).toEqual(["Viagem", id, "ViagemIniciada"]);
  expect(JSON.parse(event[3] as string)).toMatchObject({
    usuario_id: scope.userId,
    ocorrido_em: at.toISOString(),
  });
  expect(release).toHaveBeenCalledTimes(1);
});

test("repetir o mesmo destino não duplica histórico/evento", async () => {
  status = "Em deslocamento";
  await model.transition(id, { status: "Em deslocamento" }, scope);
  expect(query.mock.calls.some(([sql]) => /^(UPDATE|INSERT)/.test(sql))).toBe(
    false,
  );
});

test.each([
  "UPDATE viagens",
  "INSERT INTO historico_status_viagem",
  "INSERT INTO outbox_events",
])("faz rollback quando falha %s", async (sql) => {
  failure = sql;
  await expect(
    model.transition(id, { status: "Em deslocamento" }, scope),
  ).rejects.toThrow("Falha simulada");
  expect(query).toHaveBeenCalledWith("ROLLBACK");
  expect(query).not.toHaveBeenCalledWith("COMMIT");
  expect(release).toHaveBeenCalledTimes(1);
});

test("viagem inexistente ou fora do escopo não grava", async () => {
  query.mockResolvedValue({ rows: [] });
  await expect(
    model.transition(
      id,
      { status: "Em deslocamento" },
      { ...scope, manager: false },
    ),
  ).rejects.toMatchObject({ status: 404 });
  expect(query.mock.calls.some(([sql]) => /^(UPDATE|INSERT)/.test(sql))).toBe(
    false,
  );
});

test("motorista não pode cancelar mesmo a própria viagem", async () => {
  await expect(
    model.transition(
      id,
      { status: "Cancelada", motivo: "Teste" },
      { ...scope, manager: false },
    ),
  ).rejects.toMatchObject({ status: 403 });
  expect(query.mock.calls.some(([sql]) => /^(UPDATE|INSERT)/.test(sql))).toBe(
    false,
  );
});

test("cancelamento de solicitação usa a mesma conexão e emite ViagemCancelada", async () => {
  await requestModel.cancel(id, "Reprogramação", scope);
  expect(pool.connect).toHaveBeenCalledTimes(1);
  expect(query.mock.calls.filter(([sql]) => sql === "BEGIN")).toHaveLength(1);
  const event = query.mock.calls.find(([sql]) =>
    sql.includes("INSERT INTO outbox_events"),
  );
  expect(event?.[1].slice(0, 3)).toEqual(["Viagem", id, "ViagemCancelada"]);
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining("INSERT INTO historico_status_viagem"),
    [id, "Agendada", "Cancelada", scope.userId, "Reprogramação"],
  );
  expect(query).toHaveBeenCalledWith("COMMIT");
});

test("falha na outbox também desfaz cancelamento da solicitação", async () => {
  failure = "INSERT INTO outbox_events";
  await expect(
    requestModel.cancel(id, "Reprogramação", scope),
  ).rejects.toThrow();
  expect(query).toHaveBeenCalledWith("ROLLBACK");
  expect(query).not.toHaveBeenCalledWith("COMMIT");
});
