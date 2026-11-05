import { sendEmail } from "./mailerService";
const originalEnv = { ...process.env };
const originalFetch = global.fetch;
const fetchMock = jest.fn();
const message = {
  to: "test@example.com",
  subject: "Teste",
  text: "Teste",
  messageKey: "alert-1",
};
beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  process.env.EMAIL_ALERTS_ENABLED = "true";
  process.env.BREVO_API_KEY = "test-key";
  process.env.EMAIL_FROM = "sender@gmail.com";
  process.env.EMAIL_FROM_NAME = "FrotaManager";
});
afterEach(() => {
  process.env = { ...originalEnv };
  global.fetch = originalFetch;
});
test("não envia com alertas desabilitados ou credencial ausente", async () => {
  delete process.env.EMAIL_ALERTS_ENABLED;
  expect(await sendEmail(message)).toMatchObject({
    success: false,
    uncertain: false,
  });
  process.env.EMAIL_ALERTS_ENABLED = "true";
  delete process.env.BREVO_API_KEY;
  expect(await sendEmail(message)).toMatchObject({
    success: false,
    retryable: false,
  });
  expect(fetchMock).not.toHaveBeenCalled();
});
test("envia pela API HTTPS com remetente e destinatário configurados", async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ messageId: "brevo-1" }),
  });
  expect(await sendEmail(message)).toEqual({
    success: true,
    messageId: "brevo-1",
  });
  const [url, request] = fetchMock.mock.calls[0];
  expect(url).toBe("https://api.brevo.com/v3/smtp/email");
  expect(request.headers["api-key"]).toBe("test-key");
  expect(JSON.parse(request.body)).toMatchObject({
    sender: { email: "sender@gmail.com", name: "FrotaManager" },
    to: [{ email: "test@example.com" }],
    textContent: "Teste",
    headers: { "X-Mailin-custom": "alert_id:alert-1" },
  });
});
test.each([400, 401, 403])(
  "HTTP %s exige corrigir configuração sem novas tentativas automáticas",
  async (status) => {
    fetchMock.mockResolvedValue({ ok: false, status });
    expect(await sendEmail(message)).toMatchObject({
      success: false,
      retryable: false,
      uncertain: false,
    });
  },
);
test("limite de envio permite tentar novamente", async () => {
  fetchMock.mockResolvedValue({ ok: false, status: 429 });
  expect(await sendEmail(message)).toMatchObject({
    success: false,
    retryable: true,
    uncertain: false,
  });
});
test("timeout não reenvia automaticamente nem expõe o erro", async () => {
  fetchMock.mockRejectedValue(new Error("secret-key"));
  const result = await sendEmail(message);
  expect(result).toMatchObject({
    success: false,
    retryable: false,
    uncertain: true,
  });
  expect(JSON.stringify(result)).not.toContain("secret-key");
});
test("HTTP 5xx ou confirmação incompleta vai para revisão", async () => {
  fetchMock
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
  expect(await sendEmail(message)).toMatchObject({
    uncertain: true,
    retryable: false,
  });
  expect(await sendEmail(message)).toMatchObject({
    uncertain: true,
    retryable: false,
  });
});
