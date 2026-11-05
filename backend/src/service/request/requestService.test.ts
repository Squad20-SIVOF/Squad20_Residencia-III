import service from "./requestService";
import model from "../../models/requestModel";
import profileModel from "../../models/profileModel";
import {
  requestQuerySchema,
  requestUpdateSchema,
} from "../../middleware/validations/schemas/requestSchema";

jest.mock("../../models/requestModel", () => {
  const actual = jest.requireActual("../../models/requestModel");
  return {
    ...actual,
    __esModule: true,
    default: {
      isManager: jest.fn(),
      list: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
  };
});
jest.mock("../../models/profileModel", () => ({
  __esModule: true,
  default: { permissions: jest.fn() },
}));
const userId = "11111111-1111-4111-8111-111111111111";
const requestId = "22222222-2222-4222-8222-222222222222";
const body = {
  categoria: "Administrativa",
  flag_urgencia: false,
  data_necessidade: "2026-11-15T14:00:00-03:00",
};

describe("solicitações: validação e acesso", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .mocked(profileModel.permissions)
      .mockResolvedValue(["solicitacoes:ler-proprias"]);
    jest.mocked(model.isManager).mockResolvedValue(false);
    jest
      .mocked(model.list)
      .mockResolvedValue({ dados: [], total: 0, pagina: 1, limite: 20 });
  });
  it("exige usuário autenticado", async () => {
    expect((await service.list({})).status).toBe(401);
    expect(model.list).not.toHaveBeenCalled();
  });
  it("rejeita usuário inativo", async () => {
    jest.mocked(profileModel.permissions).mockResolvedValue(null);
    expect((await service.list({}, userId)).status).toBe(401);
  });
  it("nega acesso sem perfil gestor nem permissão de leitura própria", async () => {
    jest.mocked(profileModel.permissions).mockResolvedValue([]);
    expect((await service.get(requestId, userId)).status).toBe(403);
    expect(model.get).not.toHaveBeenCalled();
  });
  it("mantém o escopo próprio mesmo quando filtra por outro solicitante", async () => {
    expect(
      (await service.list({ solicitante: requestId }, userId)).status,
    ).toBe(200);
    expect(model.list).toHaveBeenCalledWith(
      { userId, manager: false },
      { pagina: 1, limite: 20, solicitante: requestId },
    );
  });
  it("permite leitura global ao gestor", async () => {
    jest.mocked(profileModel.permissions).mockResolvedValue([]);
    jest.mocked(model.isManager).mockResolvedValue(true);
    expect((await service.list({}, userId)).status).toBe(200);
    expect(model.list).toHaveBeenCalledWith(
      { userId, manager: true },
      { pagina: 1, limite: 20 },
    );
  });
  it("solicitante não pode cancelar, mesmo a própria solicitação", async () => {
    expect(
      (
        await service.cancel(
          requestId,
          { motivo: "Não será necessária" },
          userId,
        )
      ).status,
    ).toBe(403);
    expect(model.cancel).not.toHaveBeenCalled();
  });
  it("gestor precisa informar motivo e recebe o motivo normalizado", async () => {
    jest.mocked(model.isManager).mockResolvedValue(true);
    expect(
      (await service.cancel(requestId, { motivo: "  " }, userId)).status,
    ).toBe(400);
    expect(model.cancel).not.toHaveBeenCalled();
    expect(
      (await service.cancel(requestId, { motivo: "  Reprogramação  " }, userId))
        .status,
    ).toBe(200);
    expect(model.cancel).toHaveBeenCalledWith(requestId, "Reprogramação", {
      userId,
      manager: true,
    });
  });
  it("rejeita UUID inválido antes de consultar a solicitação", async () => {
    expect((await service.get("inválido", userId)).status).toBe(400);
    expect(model.get).not.toHaveBeenCalled();
  });
  it("não permite alterar o status nem trocar o solicitante pelo PUT", async () => {
    for (const extra of [
      { status: "Aprovada" },
      { solicitante_id: requestId },
    ]) {
      expect(
        (await service.update(requestId, { ...body, ...extra }, userId)).status,
      ).toBe(400);
    }
    expect(model.update).not.toHaveBeenCalled();
  });
  it("encaminha edição válida com a identidade da sessão", async () => {
    expect((await service.update(requestId, body, userId)).status).toBe(200);
    expect(model.update).toHaveBeenCalledWith(requestId, body, {
      userId,
      manager: false,
    });
  });
  it.each([
    { pagina: 0 },
    { pagina: 1.5 },
    { limite: 101 },
    { limite: "" },
    { data_inicio: "2026-02-30" },
    { data_inicio: "2026-11-02", data_fim: "2026-11-01" },
    { tipo: "inexistente" },
    { setor: "inválido" },
    { manager: true },
    { status: ["Pendente"] },
  ])("rejeita filtro inválido: %j", (query) => {
    expect(requestQuerySchema.safeParse(query).success).toBe(false);
  });
  it("exige data válida com fuso explícito e booleano real", () => {
    expect(
      requestUpdateSchema.safeParse({ ...body, data_necessidade: "2026-11-15" })
        .success,
    ).toBe(false);
    expect(
      requestUpdateSchema.safeParse({ ...body, flag_urgencia: "false" })
        .success,
    ).toBe(false);
    expect(requestUpdateSchema.safeParse(body).success).toBe(true);
  });
});
