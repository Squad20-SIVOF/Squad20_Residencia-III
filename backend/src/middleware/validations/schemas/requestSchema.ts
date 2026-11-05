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
      .max(1000),
  })
  .strict();
export type RequestQuery = z.infer<typeof requestQuerySchema>;
export type RequestInput = z.infer<typeof requestUpdateSchema>;
