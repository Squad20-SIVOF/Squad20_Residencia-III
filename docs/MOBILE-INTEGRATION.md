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
