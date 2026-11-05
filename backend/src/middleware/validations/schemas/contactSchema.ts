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
