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
let permissions: string[];

beforeEach(() => {
  jest.resetAllMocks();
  status = "Agendada";
  failure = undefined;
  permissions = ["viagens:gerenciar"];
  query = jest.fn(async (sql: string, values?: unknown[]) => {
    if (failure && sql.includes(failure)) throw new Error("Falha simulada");
    if (sql.trim().startsWith("SELECT 1 FROM usuarios u"))
      return { rows: [{ id }] };
    if (sql.startsWith("SELECT motorista_id FROM usuarios"))
      return { rows: [{ motorista_id: id }] };
    if (sql.includes("extra.permissoes AS individuais"))
      return { rows: [{ permissoes: permissions }] };
    if (sql.startsWith("SELECT id FROM motoristas")) return { rows: [{ id }] };
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
  query.mockImplementation(async (sql: string) => {
    if (sql.startsWith("SELECT motorista_id"))
      return { rows: [{ motorista_id: id }] };
    if (sql.includes("extra.permissoes"))
      return { rows: [{ permissoes: ["viagens:atualizar-proprias"] }] };
    if (sql.startsWith("SELECT id FROM motoristas")) return { rows: [{ id }] };
    return { rows: [] };
  });
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
  permissions = ["viagens:atualizar-proprias"];
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
  const sqls = query.mock.calls.map(([sql]) => String(sql));
  expect(
    sqls.findIndex((sql) => sql.includes("pg_advisory_xact_lock_shared")),
  ).toBeLessThan(
    sqls.findIndex(
      (sql) => sql.includes("FROM solicitacoes") && sql.includes("FOR UPDATE"),
    ),
  );
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

test("gestor cancela viagem em deslocamento com histórico e evento", async () => {
  status = "Em deslocamento";
  await model.transition(
    id,
    { status: "Cancelada", motivo: "Retorno solicitado" },
    scope,
  );
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining("INSERT INTO historico_status_viagem"),
    [id, "Em deslocamento", "Cancelada", scope.userId, "Retorno solicitado"],
  );
  const event = query.mock.calls.find(([sql]) =>
    sql.includes("INSERT INTO outbox_events"),
  );
  expect(event?.[1][2]).toBe("ViagemCancelada");
  expect(query).toHaveBeenCalledWith("COMMIT");
});

test("cancelamento da solicitação também cancela viagem em deslocamento", async () => {
  status = "Em deslocamento";
  await requestModel.cancel(id, "Retorno solicitado", scope);
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining("INSERT INTO historico_status_viagem"),
    [id, "Em deslocamento", "Cancelada", scope.userId, "Retorno solicitado"],
  );
  expect(query).toHaveBeenCalledWith("COMMIT");
});

test("motorista não cancela viagem em deslocamento", async () => {
  permissions = ["viagens:atualizar-proprias"];
  status = "Em deslocamento";
  await expect(
    model.transition(
      id,
      { status: "Cancelada", motivo: "Teste" },
      { ...scope, manager: false },
    ),
  ).rejects.toMatchObject({ status: 403 });
  expect(query).toHaveBeenCalledWith("ROLLBACK");
});

test("escopo de gestor obsoleto não ignora permissão revogada", async () => {
  permissions = [];
  await expect(
    model.transition(id, { status: "Em deslocamento" }, scope),
  ).rejects.toMatchObject({ status: 403 });
  expect(query.mock.calls.some(([sql]) => /^(UPDATE|INSERT)/.test(sql))).toBe(
    false,
  );
  expect(query).toHaveBeenCalledWith("ROLLBACK");
});
