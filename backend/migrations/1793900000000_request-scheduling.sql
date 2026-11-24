-- Up Migration
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE solicitacoes
  ADD COLUMN codigo integer GENERATED ALWAYS AS IDENTITY,
  ADD COLUMN origem varchar(300),
  ADD COLUMN destino varchar(300),
  ADD COLUMN setor varchar(100),
  ADD COLUMN data_retorno_prevista timestamptz,
  ADD COLUMN numero_passageiros integer CHECK (numero_passageiros > 0),
  ADD COLUMN veiculo_preferencial_id uuid REFERENCES veiculos(id) ON DELETE SET NULL,
  ADD COLUMN motivo varchar(1000),
  ADD COLUMN motivo_recusa varchar(500),
  ADD CONSTRAINT solicitacoes_periodo_check CHECK (data_retorno_prevista > data_necessidade);

ALTER TABLE viagens
  ADD COLUMN saida_prevista timestamptz,
  ADD COLUMN retorno_previsto timestamptz,
  ADD CONSTRAINT viagens_periodo_previsto_check CHECK (
    (saida_prevista IS NULL AND retorno_previsto IS NULL)
    OR (saida_prevista IS NOT NULL AND retorno_previsto IS NOT NULL AND retorno_previsto > saida_prevista)
  ),
  ADD CONSTRAINT viagens_reserva_veiculo EXCLUDE USING gist (
    veiculo_id WITH =, tstzrange(saida_prevista, retorno_previsto, '[)') WITH &&
  ) WHERE (saida_prevista IS NOT NULL AND status NOT IN ('Cancelada', 'Finalizada')),
  ADD CONSTRAINT viagens_reserva_motorista EXCLUDE USING gist (
    motorista_id WITH =, tstzrange(saida_prevista, retorno_previsto, '[)') WITH &&
  ) WHERE (saida_prevista IS NOT NULL AND status NOT IN ('Cancelada', 'Finalizada'));

-- Down Migration
ALTER TABLE viagens
  DROP CONSTRAINT viagens_reserva_motorista,
  DROP CONSTRAINT viagens_reserva_veiculo,
  DROP CONSTRAINT viagens_periodo_previsto_check,
  DROP COLUMN retorno_previsto,
  DROP COLUMN saida_prevista;
ALTER TABLE solicitacoes
  DROP CONSTRAINT solicitacoes_periodo_check,
  DROP COLUMN motivo_recusa, DROP COLUMN motivo,
  DROP COLUMN veiculo_preferencial_id, DROP COLUMN numero_passageiros,
  DROP COLUMN data_retorno_prevista, DROP COLUMN setor,
  DROP COLUMN destino, DROP COLUMN origem, DROP COLUMN codigo;
-- btree_gist pode ser utilizada por outras tabelas; não remover a extensão.
