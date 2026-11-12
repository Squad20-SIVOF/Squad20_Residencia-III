-- Up Migration
CREATE TABLE viagens_registros_painel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viagem_id uuid NOT NULL REFERENCES viagens(id) ON DELETE RESTRICT,
  usuario_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo varchar(6) NOT NULL CHECK (tipo IN ('inicio', 'fim')),
  km integer NOT NULL CHECK (km >= 0),
  foto text NOT NULL CHECK (length(foto) <= 7340032),
  criado_em timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (viagem_id, tipo)
);

-- Down Migration
DROP TABLE viagens_registros_painel;
