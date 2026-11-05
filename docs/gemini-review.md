# Reviewer de PRs com Gemini

## Ativar

1. Cadastre `GEMINI_API_KEY` em **Settings → Secrets and variables → Actions → New repository secret**. Cole sua chave somente no campo Secret.
2. Opcional: na aba **Variables**, crie `GEMINI_MODEL` com o identificador de um modelo disponível para sua chave. Padrão: `gemini-2.5-flash`; disponibilidade e gratuidade devem ser conferidas no AI Studio.
3. Faça merge do PR de instalação na `main`. O workflow e o script precisam estar na branch principal.
4. Abra um PR não draft de uma branch deste repositório, ou envie um novo commit a um PR existente. Também pode usar **Actions → Gemini PR Review → Run workflow**, na branch principal, informando o número de um PR aberto.
5. Confira a execução na aba Actions e o comentário do `github-actions[bot]` no PR.

Não é necessário cadastrar PAT/GitHub token: o workflow usa `GITHUB_TOKEN` automaticamente. Políticas da organização precisam permitir Actions e escrita de comentários com esse token.

## Comportamento e limites

- Um comentário geral por PR, atualizado a cada execução. Não aprova, bloqueia, altera código ou publica comentários inline.
- Apenas PRs internos; forks, Dependabot e rascunhos são ignorados nesta versão.
- Executa somente o script da branch principal com `pull_request_target`; nunca executa código do PR, instala dependências ou chama shell com conteúdo do diff.
- Envia patches para o Gemini, até 60.000 caracteres por execução. Não envia o repositório inteiro nem busca contexto adicional além do diff. A cobertura é informada no comentário.
- Ignora .env, lockfiles, alguns formatos binários e diretórios gerados. Isso não é um detector de segredos: outros arquivos ainda podem conter dados sensíveis.
- Uma chamada ao Gemini por execução com patches elegíveis. Cota esgotada, chave inválida e resposta incompleta fazem o job falhar sem publicar análise parcial; não há fallback pago nem repetição automática de chamadas.
- Gratuidade depende do modelo, configuração de cobrança, cotas do Gemini e minutos do Actions. No free tier do Gemini, considere a política de uso de dados antes de enviar código confidencial.
- Revisão de IA pode errar. Testes e revisão humana continuam necessários.

## Diagnóstico

- **Chave ausente:** confira o nome exato `GEMINI_API_KEY` como repository secret.
- **HTTP 403:** confira restrições da chave Gemini e políticas/permissões do GitHub conforme a etapa que falhou.
- **HTTP 404:** confira `GEMINI_MODEL` e se ele está disponível para sua chave.
- **HTTP 429:** cota/limite do Gemini excedido; aguarde e execute manualmente mais tarde.
- **Workflow não aparece:** confirme que os arquivos foram incorporados à branch principal.

Referências: https://ai.google.dev/gemini-api/docs/pricing e https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
