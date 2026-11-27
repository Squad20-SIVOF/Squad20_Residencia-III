-- Up Migration
ALTER TABLE veiculos ADD COLUMN foto text;

-- Down Migration
ALTER TABLE veiculos DROP COLUMN foto;
