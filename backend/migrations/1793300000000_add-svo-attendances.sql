-- Up Migration
-- O chamado existe antes da viagem e do registro de coleta em obitos.
CREATE TABLE atendimentos_svo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  falecido_nome varchar(150),
  solicitante_nome varchar(150) NOT NULL,
  solicitante_telefone varchar(11) NOT NULL CHECK (solicitante_telefone ~ '^[0-9]{10,11}$'),
  endereco_ocorrencia varchar(500) NOT NULL,
  prioridade varchar(10) NOT NULL DEFAULT 'Normal' CHECK (prioridade IN ('Normal', 'Alta', 'Urgente')),
  observacoes varchar(2000),
  status varchar(30) NOT NULL DEFAULT 'Registrada',
  registrado_por uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (falecido_nome IS NULL OR LENGTH(TRIM(falecido_nome)) >= 2),
  CHECK (LENGTH(TRIM(solicitante_nome)) >= 2),
  CHECK (LENGTH(TRIM(endereco_ocorrencia)) >= 5)
);
CREATE INDEX atendimentos_svo_prioridade_idx ON atendimentos_svo (
  (CASE prioridade WHEN 'Urgente' THEN 0 WHEN 'Alta' THEN 1 ELSE 2 END), criado_em, id
);
UPDATE perfis SET permissoes = ARRAY(
  SELECT DISTINCT unnest(permissoes || ARRAY['svo:registrar', 'svo:ler'])
) WHERE codigo IN ('atendente_svo', 'gestor_svo', 'gestor_frota', 'administrador');

-- Down Migration
UPDATE perfis SET permissoes = array_remove(array_remove(permissoes, 'svo:registrar'), 'svo:ler');
DROP TABLE atendimentos_svo;
