import { z } from "zod";

export const multaIdSchema = z.string().uuid("ID inválido");

export const multaInputSchema = z
  .object({
    veiculo_id: z.string().uuid("ID do veículo inválido"),
    motorista_id: z
      .string()
      .uuid("ID do motorista inválido")
      .nullable()
      .optional(),
    auto_infracao: z.string().trim().max(50).nullable().optional(),
    data_infracao: z.iso.date(),
    local_infracao: z.string().trim().max(300).nullable().optional(),
    descricao: z
      .string()
      .trim()
      .min(3, "Descrição deve ter ao menos 3 caracteres")
      .max(500),
    gravidade: z.enum(["Leve", "Média", "Grave", "Gravíssima"]),
    pontos: z.number().int().min(0).max(7),
    valor: z
      .number()
      .nonnegative("Valor não pode ser negativo")
      .max(99999999.99),
    status: z.enum(["Pendente", "Paga", "Recurso", "Cancelada"]),
    data_pagamento: z.iso.date().nullable().optional(),
    observacoes: z.string().trim().max(1000).nullable().optional(),
  })
  .strict()
  .refine(
    (v) => v.status !== "Paga" || v.data_pagamento != null,
    "Data de pagamento é obrigatória quando status é Paga",
  );

export const multaQuerySchema = z
  .object({
    veiculo_id: z.string().uuid().optional(),
    motorista_id: z.string().uuid().optional(),
    status: z.enum(["Pendente", "Paga", "Recurso", "Cancelada"]).optional(),
    data_inicio: z.iso.date().optional(),
    data_fim: z.iso.date().optional(),
  })
  .strict()
  .refine(
    (q) => !q.data_inicio || !q.data_fim || q.data_inicio <= q.data_fim,
    "Período inválido",
  );

export type MultaInput = z.infer<typeof multaInputSchema>;
export type MultaQuery = z.infer<typeof multaQuerySchema>;
