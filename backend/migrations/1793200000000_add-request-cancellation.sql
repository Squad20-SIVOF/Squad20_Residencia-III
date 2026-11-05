-- Up Migration
ALTER TABLE solicitacoes ADD COLUMN motivo_cancelamento text;
ALTER TABLE historico_status_solicitacao ADD COLUMN motivo text;
CREATE INDEX solicitacoes_solicitante_criado_idx ON solicitacoes (solicitante_id, criado_em DESC, id DESC);
CREATE INDEX historico_solicitacao_data_idx ON historico_status_solicitacao (solicitacao_id, data_hora, id);

-- Down Migration
DROP INDEX historico_solicitacao_data_idx;
DROP INDEX solicitacoes_solicitante_criado_idx;
ALTER TABLE historico_status_solicitacao DROP COLUMN motivo;
ALTER TABLE solicitacoes DROP COLUMN motivo_cancelamento;
