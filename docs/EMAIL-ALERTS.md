# Alertas por e-mail com Brevo

## Como funciona

O frontend usa o CRUD real de manutenções no backend/Neon. O job coleta CNHs próximas do vencimento, marcos de quilometragem e próximas revisões com lembrete habilitado. Ele envia pela API HTTPS do Brevo, sem SMTP ou senha do Gmail. A API é compatível com o Render Free.

O agendamento continua no GitHub Actions, aproximadamente a cada 15 minutos, sujeito a atrasos. Isso evita depender do processo web do Render Free permanecer acordado. Trocar o provedor não ativa o job automaticamente.

Destinatários: e-mails cadastrados dos usuários ativos, não excluídos e com permissão efetiva `manutencoes:ler`. Não existe destinatário fixo. Remover acesso ou resolver a causa cancela pendências no próximo processamento.

## 1. Preparar a conta Brevo sem domínio próprio

1. Crie a conta em https://www.brevo.com/ e confirme o e-mail de cadastro.
2. Em configurações de **Remetentes / Senders**, adicione um remetente chamado **FrotaManager**, com um endereço que você controla, e confirme o link/código recebido.
3. Verifique se o serviço **Transactional / Transacional** está liberado. Se o painel pedir aprovação, preencha os dados reais do projeto e explique que enviará alertas de manutenção e CNH aos usuários cadastrados. A verificação do remetente não garante aprovação da conta.
4. Não tente autenticar `gmail.com` ou `vercel.app` como seu domínio. Sem domínio próprio, o Brevo documenta a substituição do domínio do remetente por `@brevosend.com`. Essa assistência é descrita como temporária e sujeita às políticas do serviço; não garante disponibilidade permanente ou entrega na caixa de entrada.
5. Em **SMTP & API → API Keys**, crie uma chave de API. Use a chave **API**, não uma chave SMTP. Não envie o valor no chat, não salve no código nem em arquivos versionados.

## 2. Configurar o agendamento no GitHub

No repositório que executará os alertas, abra **Settings → Secrets and variables → Actions**.

Em **Secrets**, cadastre:

| Secret | Valor |
| --- | --- |
| `DATABASE_URL` | Conexão Neon do banco escolhido |
| `BREVO_API_KEY` | Chave de API criada no Brevo |

Em **Variables**, cadastre:

| Variable | Valor |
| --- | --- |
| `EMAIL_FROM` | Endereço exato do remetente verificado no Brevo |
| `EMAIL_FROM_NAME` | `FrotaManager` |
| `ENABLE_EMAIL_ALERT_JOB` | `true`, após migração, configuração e revisão dos destinatários |
| `MAINTENANCE_INTERVAL_KM` | `10000` para uso normal |
| `MAINTENANCE_WARN_KM` | `500` para aviso antecipado, ou `0` para somente o limite |

O workflow `.github/workflows/email-alerts.yml` só executa na `main` com a variável de habilitação definida. Habilite em apenas um repositório, evitando principal e fork rodando contra o mesmo banco.

A migration `1793300000000_maintenance-email-alerts.sql` deve existir no banco antes do primeiro job. No Neon de desenvolvimento ela já foi aplicada durante a implementação. Para outro ambiente, configure a conexão correta e execute:

```bash
cd backend
npm ci
npm run migrate:up
```

Depois que o código chegar à `main`, abra **Actions → Alertas por e-mail → Run workflow**, selecionando `main`. Essa execução pode enviar alertas reais de todos os registros elegíveis existentes, inclusive CNHs.

Confira o resumo `sent`, `failed`, `review` no Actions e os logs de e-mails transacionais no Brevo. `sent` indica aceitação pela API; confirme também entrega e spam na caixa do destinatário.

## 3. Render e execução local

Para o agendamento acima, não é preciso colocar a chave no Render: o job roda no Actions. Se executar o serviço de envio pelo backend Render, configure lá `EMAIL_ALERTS_ENABLED=true`, `BREVO_API_KEY`, `EMAIL_FROM` e `EMAIL_FROM_NAME`. A API HTTPS pode ser chamada do Render, mas isso por si só não cria um agendamento.

Para execução local, use o `.env` ignorado pelo Git:

```dotenv
EMAIL_ALERTS_ENABLED=true
BREVO_API_KEY=chave-configurada-localmente
EMAIL_FROM=remetente-verificado@example.com
EMAIL_FROM_NAME=FrotaManager
MAINTENANCE_INTERVAL_KM=10000
MAINTENANCE_WARN_KM=500
```

Com `DATABASE_URL` configurada, `cd backend` e `npm run alerts:run` enviam mensagens reais. Os testes automatizados usam mocks e não enviam e-mails.

As antigas variáveis `SMTP_USER` e `SMTP_APP_PASSWORD` não são usadas pelo job. Revogue a senha de aplicativo Google anteriormente exposta no código: removê-la do arquivo não a elimina do histórico Git.

## Regras de quilometragem e demonstração

A referência é a maior quilometragem de manutenção concluída, ou zero quando não existe. O job usa o KM salvo no banco, sem leitura de GPS/odômetro. Concluir manutenção atualiza o KM do veículo sem reduzir uma leitura maior.

Para demonstração isolada, configure `MAINTENANCE_INTERVAL_KM=10` e `MAINTENANCE_WARN_KM=0`. Sem manutenção concluída, o marco será 10 km; uma manutenção concluída aos 10 km estabelece o próximo aos 20 km. Não reduza o intervalo em banco de uso real para testar: muitos veículos podem ficar elegíveis.

Para o resumo `/alerts/resume` usar a mesma regra, configure os intervalos também no Render. As variáveis do Actions e do Render são independentes.

Cada marco permite um aviso e um alerta crítico por destinatário. Revisões com lembrete habilitado podem avisar por KM ou data (sete dias antes e no vencimento). CNH tem aviso até 30 dias, nível alto até sete dias e crítico após vencimento.

## Fila e recuperação

`email_alert_queue` mantém conteúdo e chave única por causa/destinatário. Um lock de transação impede jobs simultâneos. Estados:

- `pending`: aguarda envio; HTTP 429 pode ter até cinco tentativas, com espera crescente.
- `sending`: envio iniciado, com reserva de dez minutos.
- `sent`: API confirmou `messageId`.
- `failed`: rejeição definitiva, configuração incorreta ou tentativas esgotadas.
- `review`: timeout, resposta ambígua, HTTP 5xx ou processo interrompido durante envio. Sem reenvio automático.
- `cancelled`: causa ou destinatário deixou de ser elegível.

O identificador `alert_id` enviado como cabeçalho de rastreamento não é garantia de idempotência do Brevo. Antes de repetir um item `review`, confira os logs transacionais. Corrigir uma chave/remetente inválido não reativa automaticamente itens `failed`; revise-os antes de recolocar em `pending`.

```sql
SELECT status, count(*) FROM email_alert_queue GROUP BY status;
SELECT id, status, attempts, last_error, created_at, sent_at
FROM email_alert_queue ORDER BY created_at DESC LIMIT 20;
```

Somente o nome do comprovante de manutenção é persistido; o arquivo não é enviado.

## Referências

- [API transacional Brevo](https://developers.brevo.com/docs/send-a-transactional-email)
- [Substituição do domínio do remetente](https://help.brevo.com/hc/en-us/articles/16045394674066-Troubleshooting-Domain-authentication)
