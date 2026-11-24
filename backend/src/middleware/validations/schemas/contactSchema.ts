import { z } from "zod";
export const optionalText = (max: number) =>
  z.string().trim().max(max).nullable().optional();
export const phoneSchema = z
  .string()
  .trim()
  .max(30)
  .refine(
    (value) => !value || /^\d{10,11}$/.test(value.replace(/\D/g, "")),
    "Telefone deve conter 10 ou 11 dígitos",
  )
  .nullable()
  .optional();
export const emailSchema = z
  .union([z.string().trim().email().max(150), z.literal("")])
  .nullable()
  .optional();
export const photoSchema = z
  .string()
  .max(7 * 1024 * 1024)
  .regex(
    /^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/,
    "Envie uma foto JPG ou PNG de até 5 MB",
  )
  .nullable()
  .optional();

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const jpegSignature = Buffer.from([255, 216, 255]);

export const verifiedPhotoSchema = photoSchema
  .unwrap()
  .unwrap()
  .refine((value) => {
    if (value.length > 7 * 1024 * 1024) return false;
    const [header, data = ""] = value.split(",");
    const bytes = Buffer.from(data, "base64");
    const signature =
      header === "data:image/png;base64" ? pngSignature : jpegSignature;
    return (
      bytes.length <= 5 * 1024 * 1024 &&
      bytes.subarray(0, signature.length).equals(signature)
    );
  }, "Envie uma foto JPG ou PNG válida de até 5 MB");
