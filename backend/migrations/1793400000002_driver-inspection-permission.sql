-- Up Migration
UPDATE perfis SET permissoes=ARRAY(SELECT DISTINCT p FROM unnest(permissoes || ARRAY['veiculos:vistoriar-proprios']) AS p) WHERE codigo='motorista';
-- Down Migration
UPDATE perfis SET permissoes=array_remove(permissoes,'veiculos:vistoriar-proprios');
