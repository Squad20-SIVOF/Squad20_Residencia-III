-- Up Migration
ALTER TABLE usuarios ADD COLUMN motorista_id uuid UNIQUE REFERENCES motoristas(id) ON DELETE SET NULL;
UPDATE perfis SET permissoes = ARRAY(SELECT DISTINCT p FROM unnest(permissoes || ARRAY['abastecimentos:criar-proprio']) AS p) WHERE codigo='motorista';
-- Down Migration
UPDATE perfis SET permissoes=array_remove(permissoes,'abastecimentos:criar-proprio');
ALTER TABLE usuarios DROP COLUMN motorista_id;
