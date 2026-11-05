import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import router from "./fuelRoutes";
import driverFuelRouter from "./driverFuelRoutes";
import { calculateFuelTotal } from "../utils/fuelUtils";
import { pool } from "../db";

jest.mock("../db", () => ({ pool: { query: jest.fn(), connect: jest.fn() } }));
jest.mock("../middleware/authorization", () => ({
  authorize:
    (permission: string) =>
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (req.headers["x-test-permission"] !== permission) {
        res.status(403).json({ message: "Sem permissão" });
        return;
      }
      next();
    },
}));
const vehicle = "10000000-0000-4000-8000-000000000001";
const driver = "10000000-0000-4000-8000-000000000002";
const record = "10000000-0000-4000-8000-000000000003";
const body = {
  veiculo_id: vehicle,
  motorista_id: driver,
  data_abastecimento: "2026-11-05T12:30:00-03:00",
  combustivel: "Diesel",
  posto: "Posto teste",
  litros: 10.25,
  preco_litro: 6.1234,
  km_momento_abastecimento: 1234,
};
let server: Server;
let base: string;
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as express.Request & { user: { id: string } }).user = {
      id: "10000000-0000-4000-8000-000000000004",
    };
    next();
  });
  app.use("/own", driverFuelRouter);
  app.use(router);
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(
  () =>
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    ),
);
beforeEach(() => jest.resetAllMocks());
const post = (value: unknown, permission = "abastecimentos:gerenciar") =>
  fetch(base, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-permission": permission,
    },
    body: JSON.stringify(value),
  });
test("recusa cadastro sem permissão antes de acessar o banco", async () => {
  expect((await post(body, "abastecimentos:ler")).status).toBe(403);
  expect(pool.connect).not.toHaveBeenCalled();
});
test.each([
  { ...body, litros: -1 },
  { ...body, preco_litro: 0 },
  { ...body, km_momento_abastecimento: 1.2 },
  { ...body, valor_total: 1 },
  { ...body, data_abastecimento: "inválida" },
])("rejeita payload inválido sem gravação: %j", async (value) => {
  expect((await post(value)).status).toBe(400);
  expect(pool.connect).not.toHaveBeenCalled();
});
test("calcula valor no servidor, sinaliza teto e atualiza hodômetro atomicamente", async () => {
  const query = jest.fn(async (sql: string) => {
    if (sql.startsWith("SELECT teto"))
      return { rows: [{ teto_gasto_mensal: 100 }] };
    if (sql.startsWith("SELECT id FROM motoristas"))
      return { rows: [{ id: driver }] };
    if (sql.includes("SUM(valor_total)")) return { rows: [{ total: 50 }] };
    if (sql.startsWith("INSERT INTO abastecimentos"))
      return { rows: [{ id: record }] };
    if (sql.includes("SELECT a.*"))
      return {
        rows: [
          { id: record, valor_total: "62.76", alerta_teto_excedido: true },
        ],
      };
    return { rows: [] };
  });
  const release = jest.fn();
  (pool.connect as jest.Mock).mockResolvedValue({ query, release });
  const response = await post(body);
  expect(response.status).toBe(201);
  expect((await response.json()).message).toMatchObject({
    valor_total: "62.76",
    alerta_teto_excedido: true,
  });
  const insert = query.mock.calls.find(([sql]) =>
    sql.startsWith("INSERT INTO abastecimentos"),
  ) as unknown as [string, unknown[]];
  expect(insert[1]).toEqual([
    vehicle,
    driver,
    body.data_abastecimento,
    "Diesel",
    "Posto teste",
    10.25,
    6.1234,
    62.76,
    1234,
    true,
  ]);
  expect(query).toHaveBeenCalledWith(expect.stringContaining("GREATEST"), [
    vehicle,
    1234,
  ]);
  expect(query).toHaveBeenCalledWith("COMMIT");
  expect(release).toHaveBeenCalled();
});
test("desfaz a transação quando o veículo não existe", async () => {
  const query = jest.fn().mockResolvedValue({ rows: [] });
  const release = jest.fn();
  (pool.connect as jest.Mock).mockResolvedValue({ query, release });
  const response = await post(body);
  expect(response.status).toBe(400);
  expect(query).toHaveBeenCalledWith("ROLLBACK");
  expect(query).not.toHaveBeenCalledWith("COMMIT");
  expect(release).toHaveBeenCalled();
});

test("mobile não aceita motorista informado no corpo", async () => {
  const response = await fetch(`${base}/own`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-permission": "abastecimentos:criar-proprio",
    },
    body: JSON.stringify(body),
  });
  expect(response.status).toBe(400);
  expect(pool.connect).not.toHaveBeenCalled();
});
test("mobile rejeita veículo não vinculado antes de gravar", async () => {
  (pool.query as jest.Mock)
    .mockResolvedValueOnce({
      rows: [{ id: driver, nome: "Motorista", motorista_coringa: false }],
    })
    .mockResolvedValueOnce({ rows: [] });
  const input: Partial<typeof body> = { ...body };
  delete input.motorista_id;
  const response = await fetch(`${base}/own`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-permission": "abastecimentos:criar-proprio",
    },
    body: JSON.stringify(input),
  });
  expect(response.status).toBe(403);
  expect(pool.connect).not.toHaveBeenCalled();
});

test("arredonda meio centavo para cima sem perder precisão binária", () => {
  expect(calculateFuelTotal(1, 1.005)).toBe(1.01);
  expect(calculateFuelTotal(10.25, 6.1234)).toBe(62.76);
});
