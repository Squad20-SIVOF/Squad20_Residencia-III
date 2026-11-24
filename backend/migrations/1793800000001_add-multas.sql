-- Up Migration
CREATE TABLE multas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id UUID NOT NULL REFERENCES veiculos(id) ON DELETE RESTRICT,
  motorista_id UUID REFERENCES motoristas(id) ON DELETE SET NULL,
  auto_infracao VARCHAR(50),
  data_infracao DATE NOT NULL,
  local_infracao VARCHAR(300),
  descricao VARCHAR(500) NOT NULL CHECK (LENGTH(TRIM(descricao)) >= 3),
  gravidade VARCHAR(20) NOT NULL DEFAULT 'Média' CHECK (gravidade IN ('Leve', 'Média', 'Grave', 'Gravíssima')),
  pontos INT NOT NULL DEFAULT 0 CHECK (pontos >= 0 AND pontos <= 7),
  valor DECIMAL(10,2) NOT NULL CHECK (valor >= 0),
  status VARCHAR(30) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Paga', 'Recurso', 'Cancelada')),
  data_pagamento DATE,
  observacoes VARCHAR(1000),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT multas_pagamento_check CHECK (
    (status = 'Paga' AND data_pagamento IS NOT NULL)
    OR (status <> 'Paga')
  )
);
CREATE INDEX multas_veiculo_idx ON multas(veiculo_id, data_infracao DESC);
CREATE INDEX multas_motorista_idx ON multas(motorista_id) WHERE motorista_id IS NOT NULL;
CREATE INDEX multas_status_idx ON multas(status);

UPDATE perfis SET permissoes = ARRAY(
  SELECT DISTINCT unnest(permissoes || ARRAY['multas:ler', 'multas:gerenciar'])
) WHERE codigo IN ('administrador', 'gestor_frota');

-- Down Migration
UPDATE perfis SET permissoes = array_remove(array_remove(permissoes, 'multas:ler'), 'multas:gerenciar');
DROP TABLE multas;
