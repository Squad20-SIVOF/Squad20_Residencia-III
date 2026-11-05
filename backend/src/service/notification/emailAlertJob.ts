import { z } from "zod";
import profileModel from "../../models/profileModel";
import { createHash } from "node:crypto";
import { pool } from "../../db";
import { emailConfig, alertIntervals } from "../../config/emailAlerts";
import { getLicenseAlerts, getMaintanceAlerts } from "./alertRules";
import { sendEmail } from "../email/mailerService";
export interface AlertCandidate {
  key: string;
  subject: string;
  text: string;
}
export async function collectCandidates(): Promise<AlertCandidate[]> {
  const [licenses, vehicles, revisions] = await Promise.all([
    getLicenseAlerts(),
    getMaintanceAlerts(),
    pool.query(`SELECT m.id,v.placa,m.descricao,m.km_proxima,v.quilometragem,
      to_char(m.proxima_revisao_data,'YYYY-MM-DD') AS due_date,
      (m.proxima_revisao_data - (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bahia')::date) AS days_left
      FROM manutencoes m JOIN veiculos v ON v.id=m.veiculo_id
      WHERE m.notificar_revisao AND m.status <> 'Cancelada' AND v.ativo AND v.deletado_em IS NULL
      AND NOT EXISTS (SELECT 1 FROM manutencoes newer WHERE newer.veiculo_id=m.veiculo_id AND newer.status='Concluída' AND newer.km_realizado IS NOT NULL AND newer.km_realizado > COALESCE(m.km_realizado,0))
      AND ((m.km_proxima IS NOT NULL AND v.quilometragem >= m.km_proxima)
        OR m.proxima_revisao_data <= (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bahia')::date + 7)`),
  ]);
  const { interval } = alertIntervals();
  const result: AlertCandidate[] = [];
  for (const driver of licenses)
    result.push({
      key: `cnh:${driver.id}:${driver.validade_cnh}:${driver.severity}`,
      subject: "SIVOF: alerta de CNH",
      text: `Motorista: ${driver.nome}. Validade: ${driver.validade_cnh}. Dias restantes: ${driver.dias_restantes}. Nível: ${driver.severity}.`,
    });
  for (const vehicle of vehicles)
    result.push({
      key: `vehicle:${vehicle.id}:${vehicle.ultimo_km_alertado + interval}:${vehicle.severity}`,
      subject: "SIVOF: revisão por quilometragem",
      text: `Veículo ${vehicle.placa}: ${vehicle.quilometragem} km. Revisão aos ${vehicle.ultimo_km_alertado + interval} km. ${vehicle.km_restantes > 0 ? `Faltam ${vehicle.km_restantes} km` : `Limite atingido ou ultrapassado em ${-vehicle.km_restantes} km`}.`,
    });
  for (const row of revisions.rows) {
    if (row.km_proxima != null && row.quilometragem >= row.km_proxima)
      result.push({
        key: `revision:${row.id}:km:${row.km_proxima}`,
        subject: "SIVOF: próxima revisão atingida",
        text: `Veículo ${row.placa}: revisão ${row.descricao ?? ""} prevista aos ${row.km_proxima} km. Quilometragem: ${row.quilometragem} km.`,
      });
    if (row.due_date && row.days_left <= 7)
      result.push({
        key: `revision:${row.id}:date:${row.due_date}:${row.days_left <= 0 ? "due" : "warning"}`,
        subject: "SIVOF: revisão por data",
        text: `Veículo ${row.placa}: revisão ${row.descricao ?? ""} prevista para ${row.due_date}.`,
      });
  }
  return result;
}
export const alertEventKey = (key: string, to: string) =>
  createHash("sha256").update(`${key}:${to.toLowerCase()}`).digest("hex");
export async function enqueueAlerts(
  candidates: AlertCandidate[],
  recipients: string[],
) {
  for (const item of candidates)
    for (const to of recipients) {
      const key = alertEventKey(item.key, to);
      // Conteúdo congelado para repetir exatamente a mesma requisição ao provedor.
      await pool.query(
        `INSERT INTO email_alert_queue(event_key,recipient,subject,body) VALUES($1,$2,$3,$4) ON CONFLICT(event_key) DO NOTHING`,
        [key, to, item.subject, item.text],
      );
    }
}
export async function deliverPending() {
  const summary = { sent: 0, failed: 0, review: 0 };
  // Envio sem confirmação não pode ser repetido com segurança após queda do processo.
  const review = await pool.query(
    `UPDATE email_alert_queue SET status='review',locked_until=NULL WHERE status='sending' AND locked_until<NOW()`,
  );
  summary.review = review.rowCount ?? 0;
  for (let index = 0; index < 10; index++) {
    const claim =
      await pool.query(`UPDATE email_alert_queue SET status='sending',attempts=attempts+1,
      first_attempt_at=COALESCE(first_attempt_at,NOW()),locked_until=NOW()+INTERVAL '10 minutes'
      WHERE id=(SELECT id FROM email_alert_queue WHERE status='pending'
      AND next_attempt_at<=NOW() ORDER BY created_at,id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *`);
    const row = claim.rows[0];
    if (!row) break;
    const result = await sendEmail({
      to: row.recipient,
      subject: row.subject,
      text: row.body,
      messageKey: `sivof-alert-${row.id}`,
    });
    if (result.success) {
      await pool.query(
        `UPDATE email_alert_queue SET status='sent',sent_at=NOW(),provider_id=$2,locked_until=NULL,last_error=NULL WHERE id=$1 AND attempts=$3 AND status='sending'`,
        [row.id, result.messageId, row.attempts],
      );
      summary.sent++;
    } else {
      const uncertain = result.uncertain ?? true;
      const nextStatus = uncertain
        ? "review"
        : result.retryable && row.attempts < 5
          ? "pending"
          : "failed";
      await pool.query(
        `UPDATE email_alert_queue SET status=$2,
        next_attempt_at=NOW()+make_interval(secs=>LEAST(3600,60*power(2,attempts)::integer)),locked_until=NULL,last_error=$3 WHERE id=$1 AND attempts=$4 AND status='sending'`,
        [row.id, nextStatus, result.error, row.attempts],
      );
      if (uncertain) summary.review++;
      else summary.failed++;
    }
  }
  return summary;
}
export async function getAlertRecipients(): Promise<string[]> {
  const { rows } = await pool.query(
    "SELECT id,email FROM usuarios WHERE ativo AND deletado_em IS NULL ORDER BY id",
  );
  const recipients = new Set<string>();
  for (const user of rows) {
    const email = z.email().safeParse(
      String(user.email ?? "")
        .trim()
        .toLowerCase(),
    );
    if (
      email.success &&
      (await profileModel.permissions(user.id))?.includes("manutencoes:ler")
    )
      recipients.add(email.data);
  }
  return [...recipients];
}
export async function runEmailAlerts() {
  emailConfig();
  const lock = await pool.connect();
  try {
    // Lock de transação também funciona nas conexões pooled do Neon.
    await lock.query("BEGIN");
    const acquired = await lock.query(
      "SELECT pg_try_advisory_xact_lock(203734441,21) AS acquired",
    );
    if (!acquired.rows[0].acquired)
      return { sent: 0, failed: 0, review: 0, skipped: true };
    const recipients = await getAlertRecipients();
    const candidates = await collectCandidates();
    await enqueueAlerts(candidates, recipients);
    const keys = candidates.flatMap((item) =>
      recipients.map((to) => alertEventKey(item.key, to)),
    );
    await pool.query(
      `UPDATE email_alert_queue SET status='cancelled',locked_until=NULL WHERE
      (status='pending' OR (status='sending' AND locked_until<NOW())) AND NOT(event_key=ANY($1::text[]))`,
      [keys],
    );
    return await deliverPending();
  } finally {
    try {
      await lock.query("ROLLBACK");
    } finally {
      lock.release();
    }
  }
}
