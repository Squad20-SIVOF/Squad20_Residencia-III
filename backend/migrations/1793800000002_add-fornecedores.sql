-- Up Migration
CREATE TABLE fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(150) NOT NULL CHECK (LENGTH(TRIM(nome)) >= 2),
  cnpj VARCHAR(14) UNIQUE CHECK (cnpj ~ '^[0-9]{14}$'),
  telefone VARCHAR(11) CHECK (telefone IS NULL OR telefone ~ '^[0-9]{10,11}$'),
  email VARCHAR(150),
  endereco VARCHAR(300),
  tipo_contrato VARCHAR(50) NOT NULL DEFAULT 'Locação' CHECK (tipo_contrato IN ('Locação', 'Manutenção', 'Combustível', 'Outro')),
  contrato_referencia VARCHAR(100),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  deletado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX fornecedores_ativo_idx ON fornecedores(ativo) WHERE ativo AND deletado_em IS NULL;

ALTER TABLE veiculos ADD COLUMN fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL;
CREATE INDEX veiculos_fornecedor_idx ON veiculos(fornecedor_id) WHERE fornecedor_id IS NOT NULL;

UPDATE perfis SET permissoes = ARRAY(
  SELECT DISTINCT unnest(permissoes || ARRAY['fornecedores:ler', 'fornecedores:gerenciar'])
) WHERE codigo IN ('administrador', 'gestor_frota');

-- Down Migration
UPDATE perfis SET permissoes = array_remove(array_remove(permissoes, 'fornecedores:ler'), 'fornecedores:gerenciar');
DROP INDEX veiculos_fornecedor_idx;
ALTER TABLE veiculos DROP COLUMN fornecedor_id;
DROP TABLE fornecedores;
