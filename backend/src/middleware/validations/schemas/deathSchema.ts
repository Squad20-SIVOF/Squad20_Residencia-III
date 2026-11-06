import { z } from "zod";

export const deathIdSchema = z.string().uuid("ID inválido");
const collectionStatus = z.enum(["Pendente", "Recolhido", "Concluído"]);

export const deathInputSchema = z
  .object({
    viagem_id: deathIdSchema,
    identificacao: z.string().trim().min(2).max(255).nullable(),
    local_recolhimento: z.string().trim().min(3).max(255),
    documentacao: z.string().trim().min(1).max(255).nullable().optional(),
    status_coleta: collectionStatus.default("Pendente"),
    data_hora_recolhimento: z.iso
      .datetime({ offset: true })
      .nullable()
      .optional(),
  })
  .strict()
  .refine(
    (input) =>
      input.status_coleta === "Pendente"
        ? !input.data_hora_recolhimento
        : Boolean(input.data_hora_recolhimento),
    {
      path: ["data_hora_recolhimento"],
      message:
        "A data de recolhimento é exigida somente para coletas realizadas",
    },
  );

export const deathQuerySchema = z
  .object({
    pagina: z.coerce.number().int().min(1).max(1000000).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const deathCancelSchema = z
  .object({
    motivo: z
      .string()
      .trim()
      .min(1, "Informe o motivo do cancelamento")
      .max(500),
  })
  .strict();

export type DeathInput = z.infer<typeof deathInputSchema>;
export type DeathQuery = z.infer<typeof deathQuerySchema>;
