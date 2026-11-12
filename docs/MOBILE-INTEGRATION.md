# Integração mobile do motorista

O aplicativo usa a sessão existente, com login por e-mail e senha. A conta precisa estar vinculada a um motorista ativo e ter `viagens:ler-proprias` para consultar e `viagens:atualizar-proprias` para registrar operações. As consultas e gravações ficam restritas às viagens desse motorista, inclusive para contas que também tenham perfil de gestor.

## Fluxo de status

- **Agendada → Em deslocamento:** identificar o veículo atribuído por QR ou código manual, fotografar o painel e confirmar a quilometragem.
- **Em deslocamento → Em andamento:** confirmar chegada pelo endpoint central de status.
- **Em andamento → Finalizada:** fotografar novamente o painel e confirmar a quilometragem final.

O início e a finalização gravam foto, leitura, histórico de status e evento de outbox na mesma transação. Atualizam também a quilometragem do veículo. O backend bloqueia leituras menores que a última registrada, viagens de outra conta e início simultâneo com motorista ou veículo ocupado. Reenvios idênticos da última operação não duplicam registros.

## API e banco

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/motorista/resumo` | Motorista, veículos e viagem ativa ou próxima agendada |
| GET | `/motorista/viagens?pagina=1&limite=20` | Listagem paginada própria |
| GET | `/motorista/viagens/:id` | Detalhes próprios |
| POST | `/motorista/viagens/:id/iniciar` | Foto e leitura inicial |
| POST | `/motorista/viagens/:id/finalizar` | Foto e leitura final |
| PATCH | `/viagens/:id/status` | Transição central já existente |

Os POST recebem `{ "km": 100, "foto": "data:image/png;base64,..." }`. São aceitos JPEG e PNG de até 5 MB. As fotos ficam em `viagens_registros_painel`, criada pela migration `1793600000000_add-driver-trip-captures.sql`, com um registro por viagem e tipo (`inicio` ou `fim`). Listagens e detalhes não retornam o conteúdo das fotos.

O frontend reutiliza o cliente HTTP, a autenticação, componentes e tokens visuais existentes. Mantém inspeções, abastecimentos e perfil. O rascunho de foto/leitura fica somente em memória: erros de envio permitem tentar novamente; recarregar a página exige nova captura. Não há envio offline automático.

## Integrações pendentes

A leitura do hodômetro é manual, acompanhada da foto; não foi implementado OCR. O QR aceita o identificador, UUID ou placa do veículo atribuído e não substitui a autorização no servidor. O contrato de QR/check-in/out da SCRUM-38 permanece sob responsabilidade da respectiva implementação. Não são exibidos rotas ou GPS fictícios.

A câmera exige HTTPS (ou localhost) e permissão do navegador. Também é possível selecionar uma foto e informar o código manualmente. O aplicativo usa a configuração existente de `VITE_API_URL`, sem nova chave de serviço no frontend.

## QR do veículo e vínculo de sessão

Nos detalhes do veículo, contas com `veiculos:gerenciar` podem gerar uma etiqueta com QR para impressão ou salvar como PDF pelo diálogo do navegador. Conteúdo: `sivof:veiculo:v1:<UUID>`, sem token de acesso ou dados pessoais. No menu mobile, **Veículo da sessão** lê a etiqueta e seleciona o veículo via `/motorista/veiculo-sessao` (GET, POST com `veiculo_id`, DELETE). A identificação na viagem também grava essa seleção antes de avançar.

A seleção fica em `motorista_veiculo_sessao`, ligada ao token hash da sessão, e não altera `motoristas_veiculos`. Sair remove a sessão e o vínculo por cascade; uma nova sessão começa sem seleção. Expiração impede uso. Apenas veículos já liberados por vínculo, motorista coringa ou viagem ativa atribuída são aceitos. A seleção não concede permissões nem reatribui viagens; o contrato de check-in/out da SCRUM-38 permanece separado.

## Painel simulado em desenvolvimento

No servidor de desenvolvimento, configure `ENABLE_PANEL_DEMO=true` para permitir registros de teste. A opção **Usar painel simulado** aparece apenas no Vite em desenvolvimento; builds de produção não exibem o botão. O backend recusa a simulação por padrão. O registro recebe `simulada=true` e `foto=NULL`, sem inventar evidência. A confirmação **altera status e quilometragem reais da base usada**: habilite somente na base de desenvolvimento. Captura real continua disponível e validada. Não foi implementado OCR.

A migration `1793700000000_add-driver-session-vehicle.sql` adiciona a seleção e a marcação de simulação. O rollback remove registros simulados antes de restaurar a obrigação de foto; não use rollback para preservar dados de simulação.

Após o login, o mobile abre **Veículo da sessão**. Sem veículo selecionado, tentativas de abrir início, viagens, abastecimento ou vistorias retornam à identificação. Falhas ao consultar o vínculo exibem erro e permitem nova tentativa, sem liberar a navegação. Depois de vincular, o aplicativo abre o início; seu botão **Identificar veículo** permite trocar a seleção. Isso não altera as permissões ou o motorista atribuído às viagens.

A etiqueta fica no cartão **Resumo Geral**, abaixo de **Editar veículo**. A importação da biblioteca de QR usa seu export padrão, compatível com o servidor Vite em desenvolvimento e com o build de produção.
