-- Up Migration
ALTER TABLE motoristas ADD COLUMN telefone varchar(30), ADD COLUMN email varchar(150), ADD COLUMN foto text;
ALTER TABLE usuarios ADD COLUMN telefone varchar(30), ADD COLUMN departamento varchar(150),
  ADD COLUMN cargo varchar(150), ADD COLUMN matricula varchar(50), ADD COLUMN foto text,
  ADD COLUMN senha_alterada_em timestamptz;
ALTER TABLE veiculos ADD COLUMN identificacao varchar(50), ADD COLUMN marca varchar(100),
  ADD COLUMN proxima_vistoria date, ADD COLUMN checklist_vistoria jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(checklist_vistoria) = 'array');
ALTER TABLE abastecimentos ADD COLUMN combustivel varchar(50), ADD COLUMN posto varchar(150),
  ADD COLUMN preco_litro numeric(10,4), ADD COLUMN atualizado_em timestamptz NOT NULL DEFAULT NOW();
CREATE INDEX abastecimentos_veiculo_data_idx ON abastecimentos(veiculo_id, data_abastecimento DESC);
UPDATE perfis SET permissoes = ARRAY(SELECT DISTINCT p FROM unnest(permissoes || ARRAY['abastecimentos:ler','abastecimentos:gerenciar']) AS p)
  WHERE codigo IN ('administrador','gestor_frota');
-- Down Migration
UPDATE perfis SET permissoes = array_remove(array_remove(permissoes, 'abastecimentos:ler'), 'abastecimentos:gerenciar');
DROP INDEX abastecimentos_veiculo_data_idx;
ALTER TABLE abastecimentos DROP COLUMN combustivel, DROP COLUMN posto, DROP COLUMN preco_litro, DROP COLUMN atualizado_em;
ALTER TABLE veiculos DROP COLUMN identificacao, DROP COLUMN marca, DROP COLUMN proxima_vistoria, DROP COLUMN checklist_vistoria;
ALTER TABLE usuarios DROP COLUMN telefone, DROP COLUMN departamento, DROP COLUMN cargo, DROP COLUMN matricula, DROP COLUMN foto, DROP COLUMN senha_alterada_em;
ALTER TABLE motoristas DROP COLUMN telefone, DROP COLUMN email, DROP COLUMN foto;
