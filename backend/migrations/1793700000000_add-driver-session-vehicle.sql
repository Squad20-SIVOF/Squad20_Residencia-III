-- Up Migration
CREATE TABLE motorista_veiculo_sessao (
  session_hash char(64) PRIMARY KEY REFERENCES auth_sessions(token_hash) ON DELETE CASCADE,
  veiculo_id uuid NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
  atualizado_em timestamptz NOT NULL DEFAULT NOW()
);
ALTER TABLE viagens_registros_painel ADD COLUMN simulada boolean NOT NULL DEFAULT false;
ALTER TABLE viagens_registros_painel ALTER COLUMN foto DROP NOT NULL;
ALTER TABLE viagens_registros_painel ADD CONSTRAINT painel_origem_check CHECK (
  (simulada AND foto IS NULL) OR (NOT simulada AND foto IS NOT NULL)
);

-- Down Migration
DELETE FROM viagens_registros_painel WHERE simulada;
ALTER TABLE viagens_registros_painel DROP CONSTRAINT painel_origem_check;
ALTER TABLE viagens_registros_painel ALTER COLUMN foto SET NOT NULL;
ALTER TABLE viagens_registros_painel DROP COLUMN simulada;
DROP TABLE motorista_veiculo_sessao;
