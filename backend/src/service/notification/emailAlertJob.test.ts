import { pool } from "../../db";
import { sendEmail } from "../email/mailerService";
import { alertEventKey, deliverPending, enqueueAlerts } from "./emailAlertJob";
import { alertIntervals } from "../../config/emailAlerts";
jest.mock("../../db", () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));
jest.mock("../email/mailerService", () => ({ sendEmail: jest.fn() }));
const query = pool.query as jest.Mock;
beforeEach(() => {
  jest.resetAllMocks();
  delete process.env.MAINTENANCE_INTERVAL_KM;
  delete process.env.MAINTENANCE_WARN_KM;
});
test("intervalo padrão e intervalo de demonstração", () => {
  expect(alertIntervals()).toEqual({ interval: 10000, warning: 500 });
  process.env.MAINTENANCE_INTERVAL_KM = "10";
  expect(alertIntervals()).toEqual({ interval: 10, warning: 0 });
  process.env.MAINTENANCE_WARN_KM = "500";
  expect(() => alertIntervals()).toThrow();
});
test("mesma causa e destinatário usam a mesma chave sem sobrescrever conteúdo", async () => {
  query.mockResolvedValue({ rows: [] });
  await enqueueAlerts(
    [{ key: "vehicle:1:10000:critica", subject: "Revisão", text: "10000 km" }],
    ["TEST@example.com"],
  );
  expect(query.mock.calls[0][1][0]).toBe(
    alertEventKey("vehicle:1:10000:critica", "test@example.com"),
  );
  expect(query.mock.calls[0][0]).toContain("ON CONFLICT(event_key) DO NOTHING");
});
test("envio confirmado grava sucesso com chave estável", async () => {
  query
    .mockResolvedValueOnce({ rowCount: 0 })
    .mockResolvedValueOnce({
      rows: [
        {
          id: "a1",
          recipient: "test@example.com",
          subject: "Alerta",
          body: "texto",
          attempts: 1,
        },
      ],
    })
    .mockResolvedValueOnce({ rowCount: 1 })
    .mockResolvedValueOnce({ rows: [] });
  jest
    .mocked(sendEmail)
    .mockResolvedValue({ success: true, messageId: "resend-1" });
  expect(await deliverPending()).toEqual({ sent: 1, failed: 0, review: 0 });
  expect(sendEmail).toHaveBeenCalledWith(
    expect.objectContaining({ messageKey: "sivof-alert-a1" }),
  );
  expect(query.mock.calls[2][1]).toEqual(["a1", "resend-1", 1]);
});
test("falha agenda tentativa e não marca como enviado", async () => {
  query
    .mockResolvedValueOnce({ rowCount: 0 })
    .mockResolvedValueOnce({
      rows: [
        {
          id: "a1",
          recipient: "test@example.com",
          subject: "Alerta",
          body: "texto",
          attempts: 1,
        },
      ],
    })
    .mockResolvedValueOnce({ rowCount: 1 })
    .mockResolvedValueOnce({ rows: [] });
  jest.mocked(sendEmail).mockResolvedValue({
    success: false,
    error: "Falha SMTP",
    retryable: true,
    uncertain: false,
  });
  expect((await deliverPending()).failed).toBe(1);
  expect(query.mock.calls[2][1]).toEqual(["a1", "pending", "Falha SMTP", 1]);
  expect(query.mock.calls[2][0]).not.toContain("sent_at=NOW()");
});

test("envio ambíguo fica em revisão", async () => {
  query
    .mockResolvedValueOnce({ rowCount: 0 })
    .mockResolvedValueOnce({
      rows: [
        {
          id: "a1",
          recipient: "test@example.com",
          subject: "Alerta",
          body: "texto",
          attempts: 1,
        },
      ],
    })
    .mockResolvedValueOnce({ rowCount: 1 })
    .mockResolvedValueOnce({ rows: [] });
  jest.mocked(sendEmail).mockResolvedValue({
    success: false,
    error: "Sem confirmação",
    retryable: false,
    uncertain: true,
  });
  expect((await deliverPending()).review).toBe(1);
  expect(query.mock.calls[2][1]).toEqual([
    "a1",
    "review",
    "Sem confirmação",
    1,
  ]);
});
test("queda após início do SMTP exige revisão quando o lock expira", async () => {
  query
    .mockResolvedValueOnce({ rowCount: 1 })
    .mockResolvedValueOnce({ rows: [] });
  expect((await deliverPending()).review).toBe(1);
  expect(query.mock.calls[0][0]).toContain(
    "status='sending' AND locked_until<NOW()",
  );
  expect(sendEmail).not.toHaveBeenCalled();
});
