import { driverTripCaptureSchema } from "./driverTripSchema";
const foto =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR7sAAAAASUVORK5CYII=";
it("aceita foto real e quilometragem inteira, inclusive zero", () => {
  expect(driverTripCaptureSchema.safeParse({ foto, km: 0 }).success).toBe(true);
});
it.each([
  { km: -1 },
  { km: 1.5 },
  { km: 2147483648 },
  { km: "10" },
  { foto: "data:image/png;base64,YWJj" },
  { foto: "data:image/jpeg;base64,iVBORw0KGgo=" },
  { foto: null },
  { usuario_id: "outro" },
  { status: "Finalizada" },
])("rejeita dados inválidos ou identidade no corpo: %j", (extra) => {
  expect(
    driverTripCaptureSchema.safeParse({ foto, km: 10, ...extra }).success,
  ).toBe(false);
});
