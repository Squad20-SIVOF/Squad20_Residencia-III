import { z } from "zod";
import { verifiedPhotoSchema } from "./contactSchema";

export const driverTripQuerySchema = z
  .object({
    pagina: z.coerce.number().int().min(1).max(1000000).default(1),
    limite: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
const realCaptureSchema = z
  .object({
    km: z.number().int().min(0).max(2147483647),
    foto: verifiedPhotoSchema,
  })
  .strict();
export const driverTripCaptureSchema = z.union([
  realCaptureSchema,
  z
    .object({
      km: z.number().int().min(0).max(2147483647),
      simulada: z.literal(true),
    })
    .strict(),
]);
export type DriverTripQuery = z.infer<typeof driverTripQuerySchema>;
export type DriverTripCapture = z.infer<typeof driverTripCaptureSchema>;
