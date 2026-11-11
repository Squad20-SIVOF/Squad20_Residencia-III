import service from "./tripStatusService";
import model from "../../models/tripModel";
import profiles from "../../models/profileModel";
import { DomainError } from "../../utils/serviceUtils";

jest.mock("../../models/tripModel", () => ({
  __esModule: true,
  default: { transition: jest.fn() },
}));
jest.mock("../../models/profileModel", () => ({
  __esModule: true,
  default: { permissions: jest.fn() },
}));
const id = "11111111-1111-4111-8111-111111111111";
const user = "22222222-2222-4222-8222-222222222222";
const body = { status: "Em deslocamento" };
beforeEach(() => jest.resetAllMocks());
test("rejeita ausência de sessão antes de acessar os modelos", async () => {
  expect((await service.transition(id, body)).status).toBe(401);
  expect(profiles.permissions).not.toHaveBeenCalled();
});
test.each([null, []])(
  "rejeita usuário inativo/sem permissão: %j",
  async (permissions) => {
    jest.mocked(profiles.permissions).mockResolvedValue(permissions);
    expect((await service.transition(id, body, user)).status).toBe(
      permissions === null ? 401 : 403,
    );
    expect(model.transition).not.toHaveBeenCalled();
  },
);
test.each(["viagens:gerenciar", "viagens:atualizar-proprias"])(
  "usa escopo correto para %s",
  async (permission) => {
    jest.mocked(profiles.permissions).mockResolvedValue([permission]);
    expect((await service.transition(id, body, user)).status).toBe(200);
    expect(model.transition).toHaveBeenCalledWith(id, body, {
      userId: user,
      manager: permission === "viagens:gerenciar",
    });
  },
);
test("rejeita payload extra e ID inválido sem mutação", async () => {
  jest.mocked(profiles.permissions).mockResolvedValue(["viagens:gerenciar"]);
  expect(
    (await service.transition(id, { ...body, usuario_id: user }, user)).status,
  ).toBe(400);
  expect((await service.transition("inválido", body, user)).status).toBe(400);
  expect(model.transition).not.toHaveBeenCalled();
});
test("preserva o erro de domínio e não mascara falhas inesperadas", async () => {
  jest.mocked(profiles.permissions).mockResolvedValue(["viagens:gerenciar"]);
  jest
    .mocked(model.transition)
    .mockRejectedValueOnce(new DomainError(409, "Transição inválida"));
  expect(await service.transition(id, body, user)).toEqual({
    status: 409,
    message: "Transição inválida",
  });
  jest.mocked(model.transition).mockRejectedValueOnce(new Error("Banco"));
  await expect(service.transition(id, body, user)).rejects.toThrow("Banco");
});

test.each([
  ["checkIn", "Em andamento"],
  ["checkOut", "Finalizada"],
] as const)(
  "adaptador %s reutiliza transição e sessão",
  async (action, status) => {
    jest
      .mocked(profiles.permissions)
      .mockResolvedValue(["viagens:atualizar-proprias"]);
    expect((await service[action](id, user)).status).toBe(200);
    expect(model.transition).toHaveBeenCalledWith(
      id,
      { status },
      { userId: user, manager: false },
    );
  },
);
