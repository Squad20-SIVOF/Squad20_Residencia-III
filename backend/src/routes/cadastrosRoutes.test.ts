import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import fornecedores from "./fornecedorRoutes";
import multas from "./multaRoutes";
import profiles from "../models/profileModel";
import { pool } from "../db";

jest.mock("../db", () => ({ pool: { query: jest.fn() } }));
jest.mock("../models/profileModel", () => ({
  __esModule: true,
  default: { permissions: jest.fn() },
}));

describe("autorização dos cadastros de fornecedores e multas", () => {
  let server: Server;
  let url: string;
  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      if (req.headers.authorization)
        Object.assign(req, {
          user: { id: "11111111-1111-4111-8111-111111111111" },
        });
      next();
    });
    app.use("/fornecedores", fornecedores);
    app.use("/multas", multas);
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => resolve());
    });
    url = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  });
  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });
  beforeEach(() => jest.resetAllMocks());
  const headers = {
    Authorization: "teste",
    "Content-Type": "application/json",
  };

  it.each(["fornecedores", "multas"])(
    "protege leitura e escrita de %s",
    async (resource) => {
      expect((await fetch(`${url}/${resource}`)).status).toBe(401);
      jest.mocked(profiles.permissions).mockResolvedValue([`${resource}:ler`]);
      jest.mocked(pool.query).mockResolvedValue({ rows: [] } as never);
      expect((await fetch(`${url}/${resource}`, { headers })).status).toBe(200);
      jest.mocked(pool.query).mockClear();
      for (const method of ["POST", "PUT", "DELETE"]) {
        const path =
          method === "POST"
            ? resource
            : `${resource}/11111111-1111-4111-8111-111111111111`;
        expect(
          (await fetch(`${url}/${path}`, { method, headers })).status,
        ).toBe(403);
      }
      expect(pool.query).not.toHaveBeenCalled();
    },
  );

  it("valida pagamento antes de gravar multa", async () => {
    jest.mocked(profiles.permissions).mockResolvedValue(["multas:gerenciar"]);
    const response = await fetch(`${url}/multas`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        veiculo_id: "11111111-1111-4111-8111-111111111111",
        data_infracao: "2026-11-24",
        descricao: "Infração de teste",
        gravidade: "Leve",
        pontos: 3,
        valor: 100,
        status: "Paga",
      }),
    });
    expect(response.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("retorna conflito quando o vínculo da multa não existe", async () => {
    jest.mocked(profiles.permissions).mockResolvedValue(["multas:gerenciar"]);
    jest.mocked(pool.query).mockImplementation(() => {
      throw Object.assign(new Error("Vínculo inválido"), { code: "23503" });
    });
    const response = await fetch(`${url}/multas`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        veiculo_id: "11111111-1111-4111-8111-111111111111",
        data_infracao: "2026-11-24",
        descricao: "Infração de teste",
        gravidade: "Leve",
        pontos: 3,
        valor: 100,
        status: "Pendente",
      }),
    });
    expect(response.status).toBe(409);
  });
});
