import { emailConfig } from "../../config/emailAlerts";
interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  messageKey?: string;
}
export async function sendEmail({
  to,
  subject,
  text,
  html,
  messageKey,
}: SendEmailOptions) {
  // Validação ocorre antes de qualquer chamada externa.
  let config: ReturnType<typeof emailConfig>;
  try {
    config = emailConfig();
  } catch {
    return {
      success: false,
      error: "Configuração de e-mail inválida ou desabilitada",
      retryable: false,
      uncertain: false,
    };
  }
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": config.apiKey,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: config.senderName, email: config.senderEmail },
        replyTo: { name: config.senderName, email: config.senderEmail },
        to: [{ email: to }],
        subject,
        textContent: text,
        ...(html ? { htmlContent: html } : {}),
        ...(messageKey
          ? { headers: { "X-Mailin-custom": `alert_id:${messageKey}` } }
          : {}),
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      // 429 rejeita por limite; 4xx exigem corrigir conta/remetente/dados.
      // Em 5xx não presumimos que o provedor deixou de aceitar a mensagem.
      const uncertain = response.status >= 500 || response.status < 400;
      return {
        success: false,
        error: `Brevo retornou HTTP ${response.status}`,
        retryable: response.status === 429,
        uncertain,
      };
    }
    const data: unknown = await response.json();
    if (
      typeof data !== "object" ||
      data === null ||
      !("messageId" in data) ||
      typeof data.messageId !== "string" ||
      !data.messageId
    ) {
      return {
        success: false,
        error: "Brevo não confirmou o identificador do envio",
        retryable: false,
        uncertain: true,
      };
    }
    return { success: true, messageId: data.messageId };
  } catch {
    // Timeout ou resposta perdida pode ocorrer depois da aceitação: revisão manual.
    // Não registramos corpo/erro do provedor para evitar expor dados ou credenciais.
    return {
      success: false,
      error: "Envio sem confirmação; confira os logs transacionais do Brevo",
      retryable: false,
      uncertain: true,
    };
  }
}
