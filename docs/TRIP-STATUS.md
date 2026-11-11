# Transições de status de viagens

As viagens SVO e administrativas usam uma regra central de status.

| Status atual    | Próximo status  | Evento gravado    |
| --------------- | --------------- | ----------------- |
| Agendada        | Em deslocamento | ViagemIniciada    |
| Agendada        | Cancelada       | ViagemCancelada   |
| Em deslocamento | Em andamento    | ViagemEmAndamento |
| Em deslocamento | Cancelada       | ViagemCancelada   |
| Em andamento    | Finalizada      | ViagemFinalizada  |

Finalizada e Cancelada são estados finais. Transições inválidas retornam 409 com uma mensagem explicativa. Repetir o status atual não duplica histórico ou evento.

## Alteração de status

`PATCH /viagens/:id/status`, usando a sessão autenticada:

```json
{ "status": "Em deslocamento" }
```

O Gestor de Frota pode cancelar viagens agendadas ou em deslocamento, informando o motivo:

```json
{ "status": "Cancelada", "motivo": "Viagem não será mais necessária" }
```

Administrador e Gestor SVO também recebem a permissão de gestão. Motoristas podem avançar somente suas próprias viagens e não podem cancelá-las. A identidade vem da sessão; o corpo não aceita usuário ou datas.

O cancelamento de solicitações reutiliza essa regra: cancela viagens agendadas ou em deslocamento, mas é bloqueado se houver viagem em andamento ou finalizada.

## Histórico e eventos

Cada mudança atualiza a viagem, grava `historico_status_viagem` e insere o evento em `outbox_events`, na mesma transação. Se uma gravação falhar, nenhuma alteração é confirmada. Chamadas concorrentes são serializadas por bloqueio da viagem.

`data_inicio` é registrada ao entrar em Em deslocamento; `data_fim`, ao entrar em Finalizada. O cancelamento mantém o início já registrado. Quilometragem não é alterada por essa operação.

`ObitoColetado` é gravado na primeira coleta do óbito, sem repetir o evento em edições ou na passagem de Recolhido para Concluído. O evento contém os IDs do óbito, viagem e usuário, além da data da coleta. Não contém nome, documentação ou endereço. Coletas não podem retroceder nem ser gravadas em viagens encerradas.

## Integração com QR Code

Foram adicionados adaptadores genéricos para a SCRUM-38:

- `checkIn(viagemId, usuarioId)`: Em deslocamento → Em andamento.
- `checkOut(viagemId, usuarioId)`: Em andamento → Finalizada.

A implementação do QR Code deve validar o código e chamar esses adaptadores com o usuário da sessão. A leitura e validação do QR ficam na SCRUM-38.

## Migration adicionada

`1793500000000_trip-status-transitions.sql` adiciona motivo ao histórico, permissões de gestão/alteração própria e uma restrição de status. A restrição é criada com `NOT VALID`, preservando registros legados; status desconhecidos são rejeitados pelo serviço.
