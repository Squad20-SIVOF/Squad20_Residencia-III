import { pool } from "../../db";
import profileModel from "../../models/profileModel";
import { getAlertRecipients } from "./emailAlertJob";
jest.mock("../../db", () => ({ pool: { query: jest.fn() } }));
jest.mock("../../models/profileModel", () => ({
  __esModule: true,
  default: { permissions: jest.fn() },
}));
test("usa email cadastrado de usuários autorizados", async () => {
  (pool.query as jest.Mock).mockResolvedValue({
    rows: [
      { id: "u1", email: "Gestor@example.com" },
      { id: "u2", email: "motorista@example.com" },
      { id: "u3", email: "inválido" },
    ],
  });
  jest
    .mocked(profileModel.permissions)
    .mockResolvedValueOnce(["manutencoes:ler"])
    .mockResolvedValueOnce(["viagens:ler-proprias"]);
  expect(await getAlertRecipients()).toEqual(["gestor@example.com"]);
  expect(profileModel.permissions).toHaveBeenCalledTimes(2);
});
