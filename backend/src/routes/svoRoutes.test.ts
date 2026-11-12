import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Request, Response, NextFunction } from "express";
import routes from "./svoRoutes";
import model from "../models/svoModel";
import profileModel from "../models/profileModel";

jest.mock("../models/svoModel", () => ({
  __esModule: true,
  default: { create: jest.fn(), list: jest.fn(), get: jest.fn() },
}));
jest.mock("../models/profileModel", () => ({
  __esModule: true,
  default: { permissions: jest.fn() },
}));
const userId = "11111111-1111-4111-8111-111111111111";
const body = {
  falecido_nome: null,
  solicitante_nome: "Contato de Teste",
  solicitante_telefone: "79999991234",
  endereco_ocorrencia: "Endereço de teste, 100",
};
describe("acesso e privacidade das rotas SVO", () => {
  let server: Server;
  let url: string;
  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    // Somente a identidade é simulada: a autorização real continua em execução.
    app.use(
      (
        req: Request & { user?: { id: string } },
        _res: Response,
        next: NextFunction,
      ) => {
        if (req.headers.authorization) req.user = { id: userId };
        next();
      },
    );
    app.use("/svo", routes);
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => resolve());
    });
    url =
      "http://127.0.0.1:" +
      (server.address() as AddressInfo).port +
      "/svo/atendimentos";
  });
  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });
  beforeEach(() => jest.resetAllMocks());
  const headers = {
    Authorization: "sessão de teste",
    "Content-Type": "application/json",
  };
  it("nega acesso sem autenticação", async () => {
    expect((await fetch(url)).status).toBe(401);
    expect(model.list).not.toHaveBeenCalled();
  });
  it("nega acesso administrativo sem permissão SVO", async () => {
    jest
      .mocked(profileModel.permissions)
      .mockResolvedValue(["solicitacoes:ler-proprias"]);
    expect((await fetch(url, { headers })).status).toBe(403);
    expect(
      (
        await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        })
      ).status,
    ).toBe(403);
    expect(model.create).not.toHaveBeenCalled();
  });
  it("ler não concede permissão para registrar", async () => {
    jest.mocked(profileModel.permissions).mockResolvedValue(["svo:ler"]);
    expect(
      (
        await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        })
      ).status,
    ).toBe(403);
  });
  it("cria um chamado e impede cache da resposta", async () => {
    jest.mocked(profileModel.permissions).mockResolvedValue(["svo:registrar"]);
    jest.mocked(model.create).mockResolvedValue({
      id: userId,
      prioridade: "Normal",
      status: "Registrada",
    });
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect((await response.json()).message.status).toBe("Registrada");
  });
  it("falha de banco não expõe nem registra dados pessoais", async () => {
    jest.mocked(profileModel.permissions).mockResolvedValue(["svo:ler"]);
    jest
      .mocked(model.get)
      .mockRejectedValue(new Error("Detalhe contendo dados pessoais"));
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await fetch(url + "/" + userId, { headers });
      expect(response.status).toBe(500);
      expect(await response.text()).not.toContain("dados pessoais");
      expect(log).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
