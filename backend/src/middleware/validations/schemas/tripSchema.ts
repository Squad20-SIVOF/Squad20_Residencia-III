import { z } from "zod";
import { TRIP_STATUSES } from "../../../domain/tripStatus";

export const tripIdSchema = z.string().uuid("ID inválido");
export const tripTransitionSchema = z
  .object({
    status: z.enum(TRIP_STATUSES),
    motivo: z.string().trim().min(1).max(500).optional(),
  })
  .strict()
  .refine((input) => input.status !== "Cancelada" || Boolean(input.motivo), {
    path: ["motivo"],
    message: "Informe o motivo do cancelamento",
  });
export type TripTransition = z.infer<typeof tripTransitionSchema>;
