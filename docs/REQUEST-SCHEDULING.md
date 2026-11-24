# Solicitações e agendamento

`POST /solicitacoes` exige sessão e `solicitacoes:criar`. O solicitante vem
da sessão; IDs de usuário e status enviados no corpo são rejeitados. Campos:
`origem`, `destino`, `setor`, `data_necessidade`, `numero_passageiros`, `motivo`,
`flag_urgencia`. Opcionais: `data_retorno_prevista`, `veiculo_preferencial_id`.
Datas usam ISO 8601 com offset. O frontend converte horários locais para UTC.

`PATCH /solicitacoes/:id/aprovar` recebe `veiculo_id`, `motorista_id` e,
opcionalmente, `data_retorno_prevista`. Aprovação e agendamento são uma única
operação: Pendente → Agendada. A transação valida gestor de frota ou
administrador, permissão de gestão de viagens, frota compatível, capacidade,
CNH válida até o retorno e disponibilidade dos recursos. A aprovação precisa
de retorno previsto, informado na solicitação ou pelo gestor. Retorna a
solicitação com `viagem` e grava os históricos na mesma transação.

`PATCH /solicitacoes/:id/recusar` recebe `{ "motivo": "Sem disponibilidade" }`.
Somente solicitações pendentes podem ser decididas. Repetir uma decisão
retorna 409 e não cria outra viagem. Cancelamento existente libera a reserva.

As restrições PostgreSQL `viagens_reserva_veiculo` e
`viagens_reserva_motorista` impedem sobreposição inclusive entre gravações
concorrentes. Intervalos são [saída, retorno): uma viagem pode começar no
instante em que outra termina. Horários previstos não alteram `data_inicio`
e `data_fim`, que continuam representando a execução real.

Viagens legadas sem janela prevista são preservadas. Se ainda estiverem
abertas, bloqueiam nova alocação dos mesmos recursos até conciliação. Não
há conversão automática nem estimativa de duração para dados legados.

Aplicar `1793900000000_request-scheduling.sql` antes de iniciar a versão nova.
A migration usa `btree_gist`; o usuário das migrations precisa poder instalar
essa extensão. A reversão remove os novos campos e suas informações.

Criação e atribuição nas telas usam a API. O acompanhamento de trajeto
permanece demonstrativo e separado deste fluxo. Solicitações administrativas
não alocam viaturas da frota SVO; o fluxo de ordens de coleta é independente.

Validação local: testes unitários de transação/autorização, erros de conflito,
integração dos serviços frontend, lint e tipos. Os testes PostgreSQL estão
integrados à suíte opt-in existente, via `TRIP_TEST_DATABASE_URL`, restrita ao
banco local descartável `trip_status_test`. A suíte com PostgreSQL 15 passou
em 24/11/2026: 47 testes, incluindo as migrations e os três cenários novos
de concorrência e reservas. Não usar banco de produção ou `DATABASE_URL` real.
