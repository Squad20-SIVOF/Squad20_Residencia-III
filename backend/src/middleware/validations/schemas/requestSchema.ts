import { z } from "zod";

export const requestIdSchema = z.string().uuid("ID inválido");
export const requestQuerySchema = z
  .object({
    pagina: z.coerce.number().int().min(1).max(1000000).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(20),
    status: z.string().trim().min(1).max(50).optional(),
    setor: requestIdSchema.optional(),
    solicitante: requestIdSchema.optional(),
    tipo: z.enum(["SVO", "administrativa"]).optional(),
    data_inicio: z.iso.date().optional(),
    data_fim: z.iso.date().optional(),
  })
  .strict()
  .refine(
    (query) =>
      !query.data_inicio ||
      !query.data_fim ||
      query.data_inicio <= query.data_fim,
    "Data inicial deve ser anterior ou igual à data final",
  );
export const requestUpdateSchema = z
  .object({
    categoria: z.string().trim().min(1).max(50),
    flag_urgencia: z.boolean(),
    data_necessidade: z.iso.datetime({ offset: true }),
  })
  .strict();
export const requestCancelSchema = z
  .object({
    motivo: z
      .string()
      .trim()
      .min(1, "Informe o motivo do cancelamento")
      .max(500),
  })
  .strict();
export type RequestQuery = z.infer<typeof requestQuerySchema>;
export type RequestInput = z.infer<typeof requestUpdateSchema>;

export const requestCreateSchema = z
  .object({
    origem: z.string().trim().min(1).max(300),
    destino: z.string().trim().min(1).max(300),
    setor: z.string().trim().min(1).max(100),
    data_necessidade: z.iso.datetime({ offset: true }),
    data_retorno_prevista: z.iso
      .datetime({ offset: true })
      .nullable()
      .optional(),
    numero_passageiros: z.number().int().min(1).max(100),
    veiculo_preferencial_id: requestIdSchema.nullable().optional(),
    motivo: z.string().trim().min(1).max(1000),
    flag_urgencia: z.boolean().default(false),
  })
  .strict()
  .refine(
    (input) =>
      !input.data_retorno_prevista ||
      new Date(input.data_retorno_prevista) > new Date(input.data_necessidade),
    "Retorno deve ser posterior à saída",
  );
export const requestApprovalSchema = z
  .object({
    veiculo_id: requestIdSchema,
    motorista_id: requestIdSchema,
    data_retorno_prevista: z.iso.datetime({ offset: true }).optional(),
  })
  .strict();
export type RequestCreate = z.infer<typeof requestCreateSchema>;
export type RequestApproval = z.infer<typeof requestApprovalSchema>;
