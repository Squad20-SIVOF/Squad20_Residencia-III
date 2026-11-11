# Transições de status de viagens

## Fluxo adotado

A mesma regra atende SVO e viagens administrativas:

| Atual                  | Destinos permitidos    | Evento            |
| ---------------------- | ---------------------- | ----------------- |
| Agendada               | Em deslocamento        | ViagemIniciada    |
| Agendada               | Cancelada (com motivo) | ViagemCancelada   |
| Em deslocamento        | Em andamento           | ViagemEmAndamento |
| Em andamento           | Finalizada             | ViagemFinalizada  |
| Finalizada / Cancelada | Nenhum novo estado     | —                 |

Repetir o estado atual é uma operação sem efeitos: não altera datas, histórico ou outbox. Um reenvio antigo depois de a viagem avançar retorna 409. Não se permite cancelar uma viagem já iniciada, preservando a regra existente de cancelamento de solicitações. Alterações dessa regra exigem atualizar o mapa e seus testes.

`data_inicio` é registrada ao sair de Agendada; `data_fim`, ao finalizar. Quilometragem não é alterada por este endpoint. A criação/agendamento da viagem e o cadastro de atendimento SVO continuam sendo operações distintas.

## API e autorização

`PATCH /viagens/:id/status`, autenticado pelo Bearer token existente:

```json
{ "status": "Em deslocamento" }
```

Para cancelar:

```json
{ "status": "Cancelada", "motivo": "Solicitação reprogramada" }
```

O contrato de resposta segue o projeto: `{ "message": ... }`. Sucesso retorna 200; entrada inválida, 400; ausência de autenticação/usuário ativo, 401; falta de permissão, 403; viagem inexistente ou fora do escopo próprio, 404; transição inválida, 409. Respostas não são armazenáveis em cache. Não se aceitam usuário nem datas enviados no corpo.

A migration concede `viagens:gerenciar` aos perfis Administrador, Gestor de Frota e Gestor SVO. Motorista e Motorista Coringa recebem `viagens:atualizar-proprias`: apenas viagens atribuídas ao motorista vinculado à conta, sem poder cancelar. Perfis personalizados precisam de configuração explícita por quem gerencia permissões.

## Ponto de integração da SCRUM-38

O responsável pelo QR Code deve validar formato, assinatura/token, validade, replay e vínculo do código com a viagem **antes** de chamar:

- `tripStatusService.checkIn(viagemId, req.user.id)`: Em deslocamento → Em andamento.
- `tripStatusService.checkOut(viagemId, req.user.id)`: Em andamento → Finalizada.

São adaptadores genéricos para coordenação com a SCRUM-38, não um leitor ou validador de QR pronto. A saída inicial usa `transition` com Em deslocamento. Se a SCRUM-38 adotar outra semântica, alinhar os adaptadores e os testes. Nunca obter a identidade do motorista a partir do conteúdo do QR. Os adaptadores reutilizam validação de acesso, estado, histórico e outbox; não executar UPDATE direto nas rotas do QR.

## Transação e eventos

`tripModel.transitionInTransaction` bloqueia a viagem com `FOR UPDATE`, valida a regra e grava atualização + histórico + evento usando o mesmo `PoolClient`. A operação pública abre a transação pelo helper `transaction`; cancelamentos de solicitações reutilizam a conexão já aberta, sem BEGIN aninhado. Qualquer falha desfaz todo o conjunto.

A outbox persiste eventos com `processado=false`. Não foi criado um publicador/consumidor: o aceite desta task trata da gravação durável na outbox. Um consumidor futuro deve lidar com entrega repetida usando o ID do evento.

Payload de viagem: viagem_id, usuario_id, status_anterior, status_novo, motivo e ocorrido_em. `ObitoColetado` usa o agregado Obito e contém apenas obito_id, viagem_id, usuario_id e ocorrido_em, sem nome, documentação ou endereço do falecido. O evento é gravado na primeira passagem de Pendente para Recolhido/Concluído, ou no cadastro já coletado. Edições e a passagem Recolhido → Concluído não repetem a coleta. Não se pode retroceder a coleta nem gravá-la em viagem encerrada.

## Banco e implantação

1. Executar os checks abaixo em ambiente de desenvolvimento.
2. Revisar previamente os status legados:

   ```sql
   SELECT status, COUNT(*) FROM viagens GROUP BY status;
   ```

3. Aplicar `1793500000000_trip-status-transitions.sql` com o comando de migrations existente (`npm run migrate:up`, dentro de backend), em uma janela coordenada com o deploy da API. A migration adiciona motivo no histórico, catálogo de permissões e CHECK de status.
4. O CHECK é criado com NOT VALID: não converte nem apaga registros legados, mas restringe novas gravações. Status desconhecido retorna 409 no serviço. Após conciliar registros legados, executar `ALTER TABLE viagens VALIDATE CONSTRAINT viagens_status_check;` em migration própria.
5. Reiniciar a API e testar com um gestor e com um motorista vinculado à viagem.

Não executar migrations diretamente em produção sem revisão. O rollback remove a coluna motivo do histórico; eventos já gravados permanecem na outbox.

## Validação

Dentro de backend:

```bash
npm run ci
npm run build
```

A suíte de integração adicional requer **um banco vazio e descartável**, nunca o banco configurado no `.env`. Ela aplica todas as migrations e trunca dados entre os casos. Aceita apenas localhost/127.0.0.1 e banco `trip_status_test`:

```bash
docker run --rm -d --name trip-status-tests \
  -e POSTGRES_PASSWORD=trip-tests-only -e POSTGRES_DB=trip_status_test \
  -p 127.0.0.1::5432 postgres:17-alpine
docker port trip-status-tests 5432
# Substituir PORTA pela porta acima e aguardar pg_isready.
TRIP_TEST_DATABASE_URL=postgresql://postgres:trip-tests-only@127.0.0.1:PORTA/trip_status_test \
  npm test -- --runInBand --runTestsByPath src/models/tripStatus.integration.test.ts
docker stop trip-status-tests
```

Para repetir, recriar o container/banco vazio. Sem TRIP_TEST_DATABASE_URL a suíte de integração é ignorada; testes unitários e HTTP existentes continuam executando normalmente.

## Sequência recomendada para manutenção

1. Nesta task: reutilizar transação em viagens, solicitações, óbitos e abastecimentos; regra de transição única; handler de controller compartilhado mantendo no-store e sem log bruto do SVO; validação/resultado comuns em solicitações e óbitos.
2. SCRUM-38: conectar validação do QR aos adaptadores, testar sessão e replay e alinhar a semântica de check-in/out com o fluxo acima.
3. PR separado: alinhar tipos e apresentação de status no app do motorista; ele ainda usa dados simulados e os rótulos agendada/em_andamento/concluida.
4. PR separado: dividir ManutencoesPage.tsx (852 linhas na base dev) em página de listagem, página de cadastro e MaintenanceForm. Extrair hooks por responsabilidade, sem criar formulário universal.
5. PR separado: compartilhar campos/validação e formatação realmente iguais entre abastecimentos (listagem e registro). Medir duplicação antes de extrair novos componentes.
6. PR separado: avaliar adoção do helper de transação em perfis, preservando seu advisory lock e a proteção do último Administrador. Não trocar por um CRUD genérico.

Separar arquivos reduz o tamanho por arquivo; remover duplicação reduz manutenção. A funcionalidade adiciona código e testes, portanto não se espera uma redução líquida do total do repositório.
