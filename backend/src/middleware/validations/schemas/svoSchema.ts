import { z } from "zod";

export const svoIdSchema = z.string().uuid("ID inválido");
export const svoPrioritySchema = z.enum(["Normal", "Alta", "Urgente"]);
const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^(\d{10,11}|\(\d{2}\) ?\d{4,5}-\d{4})$/,
    "Telefone inválido: informe DDD e número",
  )
  .transform((value) => value.replace(/\D/g, ""));

export const svoAttendanceSchema = z
  .object({
    // null permite registrar rapidamente uma pessoa ainda não identificada.
    falecido_nome: z.string().trim().min(2).max(150).nullable(),
    solicitante_nome: z.string().trim().min(2).max(150),
    solicitante_telefone: phoneSchema,
    endereco_ocorrencia: z.string().trim().min(5).max(500),
    prioridade: svoPrioritySchema.default("Normal"),
    observacoes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

export const svoQuerySchema = z
  .object({
    pagina: z.coerce.number().int().min(1).max(1000000).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(20),
    prioridade: svoPrioritySchema.optional(),
  })
  .strict();

export type SvoAttendanceInput = z.infer<typeof svoAttendanceSchema>;
export type SvoQuery = z.infer<typeof svoQuerySchema>;
