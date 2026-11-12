import model from "./requestModel";
import { pool } from "../db";
jest.mock("../db", () => ({ pool: { query: jest.fn() } }));
const id = "11111111-1111-4111-8111-111111111111";
beforeEach(() => jest.resetAllMocks());
it.each([
  [true, true, "Pendente", true, true],
  [false, true, "Pendente", true, false],
  [false, false, "Pendente", false, false],
  [true, true, "Cancelada", false, false],
])(
  "informa as ações disponíveis sem substituir autorização: %s %s %s",
  async (manager, own, status, edit, cancel) => {
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ id, status, solicitante_id: own ? id : "outro" }],
    });
    expect(await model.get(id, { userId: id, manager })).toMatchObject({
      pode_editar: edit,
      pode_cancelar: cancel,
    });
  },
);
