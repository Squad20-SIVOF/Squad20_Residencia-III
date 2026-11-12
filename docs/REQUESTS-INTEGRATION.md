# Integração de solicitações

- `/viagens/solicitacoes`: consulta `GET /solicitacoes?status=Pendente&pagina=…&limite=20`. A paginação usa o total da API; a busca filtra apenas a página exibida.
- `/viagens/solicitacoes/:id`: consulta `GET /solicitacoes/:id` e apresenta o histórico real. Não preenche rota, carga ou contatos com exemplos.
- Edição: `PUT /solicitacoes/:id`, apenas categoria, urgência e data de necessidade. Disponível ao próprio solicitante enquanto pendente.
- Cancelamento: `PATCH /solicitacoes/:id/cancelar`, com confirmação e motivo de até 500 caracteres. Disponível ao gestor; as viagens e os históricos são atualizados pela regra existente.

Os indicadores `pode_editar` e `pode_cancelar` orientam a apresentação da tela. O servidor continua validando toda mutação; esses campos não concedem autorização.

Aprovação, recusa e atribuição não têm endpoints e aparecem indisponíveis. O formulário de criação e o acompanhamento preexistentes continuam demonstrativos, agora identificados nas telas. Não foram criados novos endpoints de negócio nem migrations nesta integração.
