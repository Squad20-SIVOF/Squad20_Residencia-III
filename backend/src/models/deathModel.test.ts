import model from "./deathModel";
import { pool } from "../db";
import type { DeathInput } from "../middleware/validations/schemas/deathSchema";

jest.mock("../db", () => ({ pool: { connect: jest.fn(), query: jest.fn() } }));
const id = "11111111-1111-4111-8111-111111111111";
const user = "22222222-2222-4222-8222-222222222222";
const input: DeathInput = {
  viagem_id: id,
  identificacao: "Nome que não deve ir para o evento",
  local_recolhimento: "Local privado",
  status_coleta: "Recolhido",
  data_hora_recolhimento: "2026-11-11T12:00:00-03:00",
};
let query: jest.Mock;
let previous: string;
let tripStatus: string;
let failOutbox: boolean;
beforeEach(() => {
  jest.resetAllMocks();
  previous = "Pendente";
  tripStatus = "Em andamento";
  failOutbox = false;
  query = jest.fn(async (sql: string) => {
    if (sql.startsWith("SELECT viagem_id"))
      return { rows: [{ viagem_id: id, status_coleta: previous }] };
    if (sql.startsWith("SELECT status FROM viagens"))
      return { rows: [{ status: tripStatus }] };
    if (sql.startsWith("SELECT veiculo_id"))
      return { rows: [{ veiculo_id: id, status: tripStatus }] };
    if (sql.includes("SELECT capacidade_maxima"))
      return { rows: [{ capacidade_maxima: 4 }] };
    if (sql.includes("COUNT(*)")) return { rows: [{ total: 0 }] };
    if (sql.startsWith("UPDATE obitos") || sql.startsWith("INSERT INTO obitos"))
      return { rows: [{ id, ...input }] };
    if (sql.includes("INSERT INTO outbox_events") && failOutbox)
      throw new Error("Outbox indisponível");
    return { rows: [] };
  });
  (pool.connect as jest.Mock).mockResolvedValue({ query, release: jest.fn() });
});
test.each([undefined, id])(
  "emite ObitoColetado em uma coleta inicial: %s",
  async (recordId) => {
    await model.save(input, user, recordId);
    const event = query.mock.calls.find(([sql]) =>
      sql.includes("INSERT INTO outbox_events"),
    );
    expect(event?.[1].slice(0, 3)).toEqual(["Obito", id, "ObitoColetado"]);
    expect(JSON.parse(event?.[1][3])).toEqual({
      obito_id: id,
      viagem_id: id,
      usuario_id: user,
      ocorrido_em: input.data_hora_recolhimento,
    });
    expect(event?.[1][3]).not.toContain(input.identificacao);
    expect(query).toHaveBeenCalledWith("COMMIT");
  },
);
test.each(["Recolhido", "Concluído"])(
  "editar coleta %s não duplica evento",
  async (status) => {
    previous = status;
    await model.save(
      { ...input, status_coleta: status as DeathInput["status_coleta"] },
      user,
      id,
    );
    expect(
      query.mock.calls.some(([sql]) =>
        sql.includes("INSERT INTO outbox_events"),
      ),
    ).toBe(false);
  },
);
test("não emite evento ao cadastrar pendência", async () => {
  await model.save(
    { ...input, status_coleta: "Pendente", data_hora_recolhimento: null },
    user,
  );
  expect(
    query.mock.calls.some(([sql]) => sql.includes("INSERT INTO outbox_events")),
  ).toBe(false);
});
test("não permite voltar a pendente para emitir outra coleta", async () => {
  previous = "Recolhido";
  await expect(
    model.save({ ...input, status_coleta: "Pendente" }, user, id),
  ).rejects.toMatchObject({ status: 409 });
  expect(query).toHaveBeenCalledWith("ROLLBACK");
});
test.each(["Cancelada", "Finalizada"])(
  "não grava coleta em viagem %s",
  async (status) => {
    tripStatus = status;
    await expect(model.save(input, user, id)).rejects.toMatchObject({
      status: 409,
    });
    expect(
      query.mock.calls.some(([sql]) => sql.startsWith("UPDATE obitos")),
    ).toBe(false);
  },
);
test("falha de evento desfaz a gravação de coleta", async () => {
  failOutbox = true;
  await expect(model.save(input, user, id)).rejects.toThrow(
    "Outbox indisponível",
  );
  expect(query).toHaveBeenCalledWith("ROLLBACK");
  expect(query).not.toHaveBeenCalledWith("COMMIT");
});
