import schema from "../middleware/validations/schemas/maintanceSchema";
const input = {
  veiculo_id: "11111111-1111-4111-8111-111111111111",
  tipo_manutencao: "corretiva",
  status: "Agendada",
  custo: 0,
  data_servico: "2026-10-29",
  oficina: "Oficina teste",
  km_realizado: 100,
  km_proxima: 200,
  proxima_revisao_data: "2026-11-29",
  notificar_revisao: true,
};
test("aceita campos da tela e exige plano para lembretes", () => {
  expect(schema.safeParse(input).success).toBe(true);
  expect(
    schema.safeParse({ ...input, km_proxima: null, proxima_revisao_data: null })
      .success,
  ).toBe(false);
  expect(
    schema.safeParse({ ...input, proxima_revisao_data: "2026-10-28" }).success,
  ).toBe(false);
});
