-- Up Migration
ALTER TABLE manutencoes DROP CONSTRAINT manutencoes_status_check;
ALTER TABLE manutencoes ADD CONSTRAINT manutencoes_status_check CHECK (status IN ('Agendada','Em Andamento','Concluída','Cancelada'));
ALTER TABLE manutencoes ADD COLUMN oficina text NOT NULL DEFAULT '',
  ADD COLUMN data_servico date,
  ADD COLUMN hora_servico text CHECK (hora_servico IS NULL OR hora_servico ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD COLUMN proxima_revisao_data date,
  ADD COLUMN notificar_revisao boolean NOT NULL DEFAULT false,
  ADD COLUMN comprovante_nome text;
UPDATE manutencoes SET data_servico=(data_inicio AT TIME ZONE 'America/Bahia')::date;
CREATE TABLE email_alert_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed','review','cancelled')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT NOW(),
  locked_until timestamptz,
  first_attempt_at timestamptz,
  sent_at timestamptz,
  provider_id text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX email_alert_queue_pending_idx ON email_alert_queue(next_attempt_at) WHERE status IN ('pending','sending');
-- Down Migration
DROP TABLE email_alert_queue;
ALTER TABLE manutencoes DROP COLUMN oficina, DROP COLUMN data_servico, DROP COLUMN hora_servico,
  DROP COLUMN proxima_revisao_data, DROP COLUMN notificar_revisao, DROP COLUMN comprovante_nome;
-- Preserve registros agendados: use uma migração corretiva em vez de apagar dados.
ALTER TABLE manutencoes DROP CONSTRAINT manutencoes_status_check;
ALTER TABLE manutencoes ADD CONSTRAINT manutencoes_status_check CHECK (status IN ('Agendada','Em Andamento','Concluída','Cancelada'));
