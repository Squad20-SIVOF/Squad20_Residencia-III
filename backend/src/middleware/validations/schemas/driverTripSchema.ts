import { z } from "zod";
import { photoSchema } from "./contactSchema";

export const driverTripQuerySchema = z
  .object({
    pagina: z.coerce.number().int().min(1).max(1000000).default(1),
    limite: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
const realCaptureSchema = z
  .object({
    km: z.number().int().min(0).max(2147483647),
    foto: photoSchema
      .unwrap()
      .unwrap()
      .refine((value) => {
        if (value.length > 7 * 1024 * 1024) return false;
        const [header, data = ""] = value.split(",");
        const bytes = Buffer.from(data, "base64");
        const signature =
          header === "data:image/png;base64"
            ? bytes
                .subarray(0, 8)
                .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            : bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
        return signature && bytes.length <= 5 * 1024 * 1024;
      }, "Envie uma foto JPG ou PNG válida de até 5 MB"),
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
