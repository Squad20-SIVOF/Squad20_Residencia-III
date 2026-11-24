import model from "./requestWorkflowModel";
import service from "../service/request/requestWorkflowService";
import profiles from "./profileModel";
import requests from "./requestModel";
import { pool } from "../db";

jest.mock("../db", () => ({ pool: { connect: jest.fn() } }));
jest.mock("./profileModel", () => ({
  __esModule: true,
  default: { permissions: jest.fn() },
}));
jest.mock("./requestModel", () => ({
  __esModule: true,
  default: { isManager: jest.fn() },
}));
const id = "11111111-1111-4111-8111-111111111111";
const vehicle = "22222222-2222-4222-8222-222222222222";
const driver = "33333333-3333-4333-8333-333333333333";
const input = {
  origem: "Fundação",
  destino: "Hospital",
  setor: "Administrativo",
  data_necessidade: "2026-12-01T08:00:00-03:00",
  data_retorno_prevista: "2026-12-01T12:00:00-03:00",
  numero_passageiros: 2,
  motivo: "Transporte institucional",
  flag_urgencia: false,
};
const query = jest.fn();
const release = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
  (pool.connect as jest.Mock).mockResolvedValue({ query, release });
  jest
    .mocked(profiles.permissions)
    .mockResolvedValue(["solicitacoes:criar", "viagens:gerenciar"]);
  jest.mocked(requests.isManager).mockResolvedValue(true);
  query.mockImplementation(async (sql: string) => {
    if (sql.includes("FROM usuarios"))
      return { rows: [{ id, motorista_id: null }] };
    if (sql.includes("SELECT * FROM solicitacoes"))
      return {
        rows: [
          { id, status: "Pendente", categoria: "administrativa", ...input },
        ],
      };
    if (sql.includes("FROM veiculos"))
      return {
        rows: [
          {
            id: vehicle,
            status: "Disponível",
            frota: "Administrativa",
            capacidade_maxima: 4,
          },
        ],
      };
    if (sql.includes("FROM motoristas"))
      return {
        rows: [
          {
            id: driver,
            status: "Disponível",
            frota: "Administrativa",
            cnh_valida: true,
          },
        ],
      };
    if (sql.includes("INSERT INTO solicitacoes"))
      return { rows: [{ id, status: "Pendente", ...input }] };
    if (sql.includes("INSERT INTO viagens"))
      return { rows: [{ id: vehicle, status: "Agendada" }] };
    if (sql.includes("UPDATE solicitacoes"))
      return { rows: [{ id, status: "Agendada" }] };
    return { rows: [] };
  });
});

it("grava criação e histórico na mesma transação", async () => {
  expect(await model.create(input, id)).toMatchObject({
    id,
    status: "Pendente",
  });
  expect(query).toHaveBeenCalledWith(
    expect.stringContaining("historico_status_solicitacao"),
    [id, null, "Pendente", id, null],
  );
  expect(query).toHaveBeenLastCalledWith("COMMIT");
  expect(release).toHaveBeenCalled();
});
it("nega criação sem permissão e desfaz transação", async () => {
  jest.mocked(profiles.permissions).mockResolvedValue([]);
  await expect(model.create(input, id)).rejects.toMatchObject({ status: 403 });
  expect(query).toHaveBeenLastCalledWith("ROLLBACK");
  expect(query.mock.calls.some(([sql]) => sql.includes("INSERT"))).toBe(false);
});
it("agenda viagem sem preencher horários reais", async () => {
  const result = await model.approve(
    id,
    { veiculo_id: vehicle, motorista_id: driver },
    id,
  );
  expect(result.status).toBe("Agendada");
  const insert = query.mock.calls.find(([sql]) =>
    sql.includes("INSERT INTO viagens"),
  );
  expect(insert?.[0]).toContain("saida_prevista,retorno_previsto");
  expect(insert?.[0]).not.toContain("data_inicio");
  expect(query).toHaveBeenLastCalledWith("COMMIT");
});
it("conflito de reserva retorna 409 e desfaz toda aprovação", async () => {
  const original = query.getMockImplementation()!;
  query.mockImplementation(async (...args) => {
    if (args[0].includes("INSERT INTO viagens"))
      throw { code: "23P01", constraint: "viagens_reserva_motorista" };
    return original(...args);
  });
  expect(
    (
      await service.approve(
        id,
        { veiculo_id: vehicle, motorista_id: driver },
        id,
      )
    ).status,
  ).toBe(409);
  expect(query).toHaveBeenLastCalledWith("ROLLBACK");
  expect(
    query.mock.calls.some(([sql]) => sql.includes("UPDATE solicitacoes")),
  ).toBe(false);
});
it("não aprova novamente solicitação já decidida", async () => {
  const original = query.getMockImplementation()!;
  query.mockImplementation(async (...args) =>
    args[0].includes("SELECT * FROM solicitacoes")
      ? { rows: [{ id, status: "Agendada" }] }
      : original(...args),
  );
  await expect(
    model.approve(id, { veiculo_id: vehicle, motorista_id: driver }, id),
  ).rejects.toMatchObject({ status: 409 });
  expect(query).toHaveBeenLastCalledWith("ROLLBACK");
});
it("rejeita período inválido e identidade enviada no corpo", async () => {
  expect(
    (
      await service.create(
        { ...input, data_retorno_prevista: input.data_necessidade },
        id,
      )
    ).status,
  ).toBe(400);
  expect(
    (await service.create({ ...input, solicitante_id: vehicle }, id)).status,
  ).toBe(400);
  expect(pool.connect).not.toHaveBeenCalled();
});
it("recusa somente com motivo", async () => {
  expect((await service.reject(id, { motivo: " " }, id)).status).toBe(400);
  expect(pool.connect).not.toHaveBeenCalled();
});
