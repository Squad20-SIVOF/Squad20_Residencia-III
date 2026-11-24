import { z } from "zod";

export const fornecedorIdSchema = z.string().uuid("ID inválido");

export const fornecedorInputSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(2, "Nome deve ter ao menos 2 caracteres")
      .max(150),
    cnpj: z
      .string()
      .regex(/^[0-9]{14}$/, "CNPJ deve ter 14 dígitos numéricos")
      .nullable()
      .optional(),
    telefone: z
      .string()
      .regex(/^[0-9]{10,11}$/, "Telefone deve ter 10 ou 11 dígitos")
      .nullable()
      .optional(),
    email: z.string().email("E-mail inválido").max(150).nullable().optional(),
    endereco: z.string().trim().max(300).nullable().optional(),
    tipo_contrato: z.enum(["Locação", "Manutenção", "Combustível", "Outro"]),
    contrato_referencia: z.string().trim().max(100).nullable().optional(),
  })
  .strict();

export const fornecedorQuerySchema = z
  .object({
    tipo_contrato: z
      .enum(["Locação", "Manutenção", "Combustível", "Outro"])
      .optional(),
    ativo: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
  })
  .strict();

export type FornecedorInput = z.infer<typeof fornecedorInputSchema>;
export type FornecedorQuery = z.infer<typeof fornecedorQuerySchema>;
