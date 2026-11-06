-- Up Migration
ALTER TABLE obitos
  ADD COLUMN documentacao varchar(255),
  ADD COLUMN status_coleta varchar(20) NOT NULL DEFAULT 'Pendente',
  ADD COLUMN motivo_cancelamento varchar(500),
  ADD COLUMN cancelado_em timestamptz,
  ALTER COLUMN data_hora_recolhimento DROP DEFAULT;

UPDATE obitos SET status_coleta = 'Recolhido'
WHERE data_hora_recolhimento IS NOT NULL;

ALTER TABLE obitos
  ADD CONSTRAINT obitos_status_coleta_check
    CHECK (status_coleta IN ('Pendente', 'Recolhido', 'Concluído', 'Cancelado')),
  ADD CONSTRAINT obitos_cancelamento_check CHECK (
    (status_coleta = 'Cancelado' AND cancelado_em IS NOT NULL
      AND motivo_cancelamento IS NOT NULL AND length(trim(motivo_cancelamento)) > 0)
    OR
    (status_coleta <> 'Cancelado' AND cancelado_em IS NULL AND motivo_cancelamento IS NULL)
  ),
  DROP CONSTRAINT obitos_viagem_id_fkey,
  ADD CONSTRAINT obitos_viagem_id_fkey
    FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE RESTRICT;

CREATE INDEX obitos_viagem_id_idx ON obitos (viagem_id, id);

UPDATE perfis SET permissoes = ARRAY(
  SELECT DISTINCT unnest(permissoes || ARRAY['obitos:ler', 'obitos:gerenciar'])
) WHERE codigo IN ('atendente_svo', 'gestor_svo');

-- Down Migration
UPDATE perfis SET permissoes = array_remove(array_remove(permissoes, 'obitos:ler'), 'obitos:gerenciar');
DROP INDEX obitos_viagem_id_idx;
ALTER TABLE obitos
  DROP CONSTRAINT obitos_cancelamento_check,
  DROP CONSTRAINT obitos_status_coleta_check,
  DROP CONSTRAINT obitos_viagem_id_fkey,
  ADD CONSTRAINT obitos_viagem_id_fkey
    FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE CASCADE,
  ALTER COLUMN data_hora_recolhimento SET DEFAULT CURRENT_TIMESTAMP,
  DROP COLUMN cancelado_em,
  DROP COLUMN motivo_cancelamento,
  DROP COLUMN status_coleta,
  DROP COLUMN documentacao;
