# Fornecedores e multas

As rotas exigem sessão autenticada. Leitura usa `fornecedores:ler` ou
`multas:ler`; criação, alteração e exclusão usam a respectiva permissão
`:gerenciar`. A migration concede essas permissões ao administrador e ao
gestor de frota.

| Método | Rota | Operação |
| --- | --- | --- |
| GET / POST | `/fornecedores` | Listar / cadastrar |
| GET / PUT / DELETE | `/fornecedores/:id` | Consultar / substituir / excluir logicamente |
| GET / POST | `/multas` | Listar / cadastrar |
| GET | `/multas/opcoes` | Veículos e motoristas ativos para cadastro |
| GET / PUT / DELETE | `/multas/:id` | Consultar / substituir / excluir |

Fornecedor recebe `nome`, `tipo_contrato` (Locação, Manutenção, Combustível,
Outro) e, opcionalmente, `cnpj`, `telefone`, `email`, `endereco` e
`contrato_referencia`. CNPJ deve conter 14 dígitos; telefone, 10 ou 11.
A listagem aceita `tipo_contrato` e `ativo=true|false`.

Veículos aceitam `fornecedor_id` UUID ou null. Na edição, omitir esse campo
preserva o vínculo; null remove o vínculo. As consultas retornam o campo.

Multa recebe `veiculo_id`, `data_infracao` (YYYY-MM-DD), `descricao`,
`gravidade` (Leve, Média, Grave, Gravíssima), `pontos` (0–7), `valor` e
`status` (Pendente, Paga, Recurso, Cancelada). São opcionais `motorista_id`,
`auto_infracao`, `local_infracao`, `data_pagamento` e `observacoes`.
Pagamento exige `data_pagamento`. Filtros: `veiculo_id`, `motorista_id`,
`status`, `data_inicio`, `data_fim`.

Respostas seguem `{ message: resultado }`; criação retorna 201, exclusão
204, entrada inválida 400, ausência 404 e conflito de vínculo 409.

Antes de iniciar a API, aplicar `npm run migrate:up` no backend. As migrations
novas são `1793800000000_add-fornecedores.sql` e `1793800000001_add-multas.sql`.
As telas e a homologação com PostgreSQL ainda precisam ser concluídas.
