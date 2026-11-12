import { pool } from "../db";
import model from "./profileModel";
jest.mock("../db", () => ({ pool: { query: jest.fn() } }));
it("combina acessos do perfil e individuais independentemente do cargo", async () => {
  const query = pool.query as jest.Mock;
  query.mockResolvedValue({
    rows: [
      { permissoes: ["viagens:ler-proprias"], individuais: ["veiculos:ler"] },
    ],
  });
  expect(await model.permissions("usuario")).toEqual([
    "viagens:ler-proprias",
    "veiculos:ler",
  ]);
  expect(String(query.mock.calls[0][0])).not.toContain("auxiliar_gestor");
});
