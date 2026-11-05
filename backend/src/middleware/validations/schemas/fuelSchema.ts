import { z } from "zod";

export const fuelIdSchema = z.string().uuid();
export const fuelInputSchema = z
  .object({
    veiculo_id: fuelIdSchema,
    motorista_id: fuelIdSchema,
    data_abastecimento: z.iso.datetime({ offset: true }),
    combustivel: z.string().trim().min(1).max(50),
    posto: z.string().trim().min(1).max(150),
    litros: z.number().positive().max(999999.99).multipleOf(0.01),
    preco_litro: z.number().positive().max(999999.9999).multipleOf(0.0001),
    km_momento_abastecimento: z.number().int().nonnegative().max(2147483647),
  })
  .strict()
  .refine(
    (v) =>
      Math.round(v.litros * v.preco_litro * 100) >= 1 &&
      v.litros * v.preco_litro <= 99999999.99,
    "Total do abastecimento fora do limite",
  );
export const fuelQuerySchema = z
  .object({
    veiculo_id: fuelIdSchema.optional(),
    data_inicio: z.iso.date().optional(),
    data_fim: z.iso.date().optional(),
  })
  .strict()
  .refine(
    (q) => !q.data_inicio || !q.data_fim || q.data_inicio <= q.data_fim,
    "Período inválido",
  );

export type FuelInput = z.infer<typeof fuelInputSchema>;
export type FuelQuery = z.infer<typeof fuelQuerySchema>;
