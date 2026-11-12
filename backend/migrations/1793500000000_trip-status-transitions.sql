-- Up Migration
ALTER TABLE historico_status_viagem ADD COLUMN motivo varchar(500);
-- Mantém registros legados para conciliação; restringe novas gravações.
ALTER TABLE viagens ADD CONSTRAINT viagens_status_check
  CHECK (status IN ('Agendada', 'Em deslocamento', 'Em andamento', 'Finalizada', 'Cancelada')) NOT VALID;

UPDATE perfis SET permissoes = ARRAY(
  SELECT DISTINCT unnest(permissoes || ARRAY['viagens:gerenciar'])
) WHERE codigo IN ('administrador', 'gestor_frota', 'gestor_svo');
UPDATE perfis SET permissoes = ARRAY(
  SELECT DISTINCT unnest(permissoes || ARRAY['viagens:atualizar-proprias'])
) WHERE codigo IN ('motorista', 'motorista_coringa');

-- Down Migration
UPDATE perfis SET permissoes = array_remove(array_remove(permissoes, 'viagens:gerenciar'), 'viagens:atualizar-proprias');
ALTER TABLE viagens DROP CONSTRAINT viagens_status_check;
ALTER TABLE historico_status_viagem DROP COLUMN motivo;
