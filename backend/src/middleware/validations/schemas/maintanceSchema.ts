import { z } from "zod";
import { vehicleIdSchema } from "./vehicleSchema";

export const maintanceSchema = z
  .object({
    veiculo_id: vehicleIdSchema,
    tipo_manutencao: z.enum([
      "preventiva",
      "impeditiva",
      "corretiva",
      "preditiva",
    ]),
    data_inicio: z.coerce.date().optional(),
    data_fim: z.coerce.date().nullable().optional(),
    oficina: z.string().trim().max(120).optional(),
    data_servico: z.iso.date().optional(),
    hora_servico: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable()
      .optional(),
    proxima_revisao_data: z.iso.date().nullable().optional(),
    notificar_revisao: z.boolean().optional(),
    comprovante_nome: z.string().max(255).nullable().optional(),
    custo: z.number().nonnegative("Custo não pode ser negativo"),
    descricao: z.string().trim().nullable().optional(),
    status: z.enum(["Agendada", "Em Andamento", "Concluída", "Cancelada"]),
    km_realizado: z.number().int().nonnegative().nullable().optional(),
    km_proxima: z.number().int().nonnegative().nullable().optional(),
  })
  .strict()
  .refine(
    (value) =>
      !value.notificar_revisao ||
      value.km_proxima != null ||
      !!value.proxima_revisao_data,
    "Defina a próxima revisão para ativar o lembrete",
  )
  .refine(
    (value) =>
      !value.proxima_revisao_data ||
      !value.data_servico ||
      value.proxima_revisao_data > value.data_servico,
    "Próxima revisão deve ser posterior à data do serviço",
  )
  .refine(
    (value) =>
      !value.data_inicio ||
      !value.data_fim ||
      value.data_fim >= value.data_inicio,
    "Data final deve ser posterior ou igual à inicial",
  )
  .refine(
    (value) =>
      value.km_proxima == null ||
      value.km_realizado == null ||
      value.km_proxima > value.km_realizado,
    "Próxima quilometragem deve ser maior que a realizada",
  );
export const maintanceIdSchema = z.string().uuid("UUID inválido");
export type MaintenaceInput = z.infer<typeof maintanceSchema>;
export default maintanceSchema;
