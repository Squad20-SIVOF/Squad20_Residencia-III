import { TRIP_STATUSES, validateTransition } from "./tripStatus";
import { tripTransitionSchema } from "../middleware/validations/schemas/tripSchema";

const allowed = [
  ["Agendada", "Em deslocamento"],
  ["Agendada", "Cancelada"],
  ["Em deslocamento", "Em andamento"],
  ["Em deslocamento", "Cancelada"],
  ["Em andamento", "Finalizada"],
];
describe("transições de viagem", () => {
  it.each(allowed)("permite %s → %s", (from, to) => {
    expect(validateTransition(from, to as (typeof TRIP_STATUSES)[number])).toBe(
      true,
    );
  });
  it.each(TRIP_STATUSES)("reenvio de %s não gera transição", (status) => {
    expect(validateTransition(status, status)).toBe(false);
  });
  const invalid = TRIP_STATUSES.flatMap((from) =>
    TRIP_STATUSES.filter(
      (to) => from !== to && !allowed.some(([a, b]) => a === from && b === to),
    ).map((to) => [from, to] as const),
  );
  it.each(invalid)("rejeita %s → %s", (from, to) => {
    expect(() => validateTransition(from, to)).toThrow(
      `Não é possível alterar uma viagem de ${from} para ${to}`,
    );
  });
  it("rejeita status legado sem reinterpretá-lo", () => {
    expect(() => validateTransition("Concluída", "Finalizada")).toThrow(
      "não reconhecido",
    );
  });
  it("exige motivo ao cancelar e rejeita campos controlados pelo servidor", () => {
    for (const body of [
      { status: "Cancelada" },
      { status: "Cancelada", motivo: " " },
      { status: "Cancelada", motivo: "x".repeat(501) },
      { status: "Finalizada", usuario_id: "outro" },
      { status: "Finalizada", data_fim: "2026-01-01" },
    ])
      expect(tripTransitionSchema.safeParse(body).success).toBe(false);
    expect(
      tripTransitionSchema.parse({ status: "Cancelada", motivo: "  Motivo  " })
        .motivo,
    ).toBe("Motivo");
  });
});
