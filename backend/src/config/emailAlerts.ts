import { z } from "zod";
export function alertIntervals() {
  const interval = z.coerce
    .number()
    .int()
    .positive()
    .parse(process.env.MAINTENANCE_INTERVAL_KM ?? 10000);
  const warning = z.coerce
    .number()
    .int()
    .min(0)
    .max(interval - 1)
    .parse(
      process.env.MAINTENANCE_WARN_KM ??
        Math.min(500, Math.floor(interval * 0.05)),
    );
  return { interval, warning };
}
export function emailConfig() {
  if (process.env.EMAIL_ALERTS_ENABLED !== "true")
    throw new Error("Alertas por e-mail desabilitados");
  const apiKey = z.string().trim().min(1).parse(process.env.BREVO_API_KEY);
  const senderEmail = z.email().parse(process.env.EMAIL_FROM);
  const senderName = z
    .string()
    .trim()
    .min(1)
    .parse(process.env.EMAIL_FROM_NAME ?? "FrotaManager");
  return { apiKey, senderEmail, senderName };
}
