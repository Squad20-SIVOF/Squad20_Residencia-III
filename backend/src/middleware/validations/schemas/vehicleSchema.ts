import { z } from "zod";
import { fleetSchema } from "./fleetSchema";

export const vehicleSchema = z
  .object({
    identificacao: z.string().trim().max(50).nullable().optional(),
    marca: z.string().trim().max(100).nullable().optional(),
    proxima_vistoria: z.iso.date().nullable().optional(),
    checklist_vistoria: z
      .array(
        z
          .object({
            id: z.string().min(1).max(50),
            label: z.string().trim().min(1).max(150),
            isOk: z.boolean(),
          })
          .strict(),
      )
      .max(50)
      .refine(
        (items) => new Set(items.map((item) => item.id)).size === items.length,
        "Itens de vistoria duplicados",
      )
      .optional(),
    placa: z.string().trim().min(1, "Placa é obrigatória"),
    modelo: z.string().trim().min(1, "Modelo é obrigatório"),
    tipo_combustivel: z
      .string()
      .trim()
      .min(1, "Tipo de combustível é obrigatório"),
    capacidade_maxima: z
      .number()
      .int("Capacidade deve ser um número inteiro")
      .positive("Capacidade deve ser maior que zero"),
    teto_gasto_mensal: z
      .number()
      .min(0, "Teto de gasto não pode ser negativo")
      .optional(),

    frota: fleetSchema.nullable().optional(),
    exclusivo_svo: z.boolean().optional(),
    status: z.enum(["ativo", "inativo"]).optional(),
    ativo: z.boolean().optional(),

    deletado_em: z.coerce.date().nullable().optional(),
    criado_em: z.coerce.date().optional(),
    atualizado_em: z.coerce.date().optional(),
    quilometragem: z.number().int().nonnegative("KM não pode ser negativo"),
    ultimo_km_alertado: z
      .number()
      .int()
      .nonnegative("KM não pode ser negativo"),
  })
  .strict()
  .refine((value) => !value.exclusivo_svo || value.frota === "SVO", {
    message: "Veículo exclusivo do SVO deve pertencer à frota SVO",
    path: ["frota"],
  });

export const vehicleIdSchema = z.string().uuid("ID inválido");
export type VehicleInput = z.infer<typeof vehicleSchema>;

export default vehicleSchema;
