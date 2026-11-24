import { pool } from "../../db";
import vehicleSchema from "../../middleware/validations/schemas/vehicleSchema";
import vehicleModel from "../../models/vehicleModel";

jest.mock("../../db", () => ({ pool: { query: jest.fn() } }));

const vehicle = {
  placa: "ABC1D23",
  modelo: "Fiorino",
  tipo_combustivel: "Flex",
  capacidade_maxima: 58,
  quilometragem: 0,
  ultimo_km_alertado: 0,
};
const photo =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR7sAAAAASUVORK5CYII=";

test("rejeita fotos com assinatura incompatível ou mais de 5 MB", () => {
  const oversized = Buffer.alloc(5 * 1024 * 1024 + 1);
  oversized.set([255, 216, 255]);
  for (const foto of [
    photo.replace("image/png", "image/jpeg"),
    `data:image/jpeg;base64,${oversized.toString("base64")}`,
  ]) {
    expect(vehicleSchema.safeParse({ ...vehicle, foto }).success).toBe(false);
  }
});

test.each([
  ["preserva quando ausente", undefined, false, null],
  ["remove com null", null, true, null],
  ["substitui quando informada", photo, true, photo],
] as const)("atualização da foto: %s", async (_name, foto, update, value) => {
  const query = jest.mocked(pool.query);
  query.mockClear();
  query.mockResolvedValue({ rows: [] } as never);

  await vehicleModel.updateVehicle(
    "vehicle-id",
    vehicleSchema.parse({ ...vehicle, foto }),
  );

  expect(query).toHaveBeenCalledTimes(1);
  const [sql, argumentsFromDriver] = query.mock.calls[0]!;
  const parameters: unknown = argumentsFromDriver;
  expect(sql).toContain(
    "foto=CASE WHEN $13::boolean THEN $14::text ELSE foto END",
  );
  expect(Array.isArray(parameters) && parameters.slice(-2)).toEqual([
    update,
    value,
  ]);
});
