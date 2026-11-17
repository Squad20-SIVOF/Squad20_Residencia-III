# Guia de publicação — FrotaManager

## Fluxo principal

Os dois frontends receberam uma primeira publicação por Direct Upload em 17/11/2026, com builds locais validados do código da main oficial. Login público, fallback SPA e preflight CORS foram verificados; o fluxo autenticado ainda precisa de homologação. O CD automático depende dos secrets configurados e da integração deste workflow à main oficial; a publicação inicial não comprova execução do CD.

| Componente            | Origem e hospedagem                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Código oficial        | [Squad20-SIVOF/Squad20_Residencia-III](https://github.com/Squad20-SIVOF/Squad20_Residencia-III), branch `main` |
| Frontend do gestor    | Cloudflare Pages, projeto `frotamanager-gestor`                                                                |
| Frontend do motorista | Cloudflare Pages, projeto `frotamanager-motorista`                                                             |
| API                   | [Render — frotamanager-api](https://frotamanager-api.onrender.com)                                             |
| Banco                 | Neon PostgreSQL, acessível somente pelo backend                                                                |

```text
desenvolvimento → dev → PR para main oficial → checks aprovados → merge
                                                              ├─ Frontend CI → Cloudflare Pages (gestor e motorista)
                                                              └─ Backend CI → deploy hook do Render (SHA validado)
```

O frontend passa a ser publicado diretamente pelo GitHub Actions do repositório oficial. O fork de Gabriel e a sincronização da branch `automation` deixam de ser necessários para o novo fluxo. Não altere `origin` nem reescreva o histórico do fork para realizar a migração.

## Cloudflare Pages e GitHub Actions

Crie dois projetos Pages do tipo **Direct Upload**, chamados `frotamanager-gestor` e `frotamanager-motorista`, com branch de produção `main`. Os arquivos compilados serão enviados pelo Actions; não configure uma segunda publicação automática pela integração Git, que poderia publicar antes dos checks.

No repositório oficial, em **Settings → Secrets and variables → Actions**, configure:

| Tipo     | Nome                                | Valor ou finalidade                                              |
| -------- | ----------------------------------- | ---------------------------------------------------------------- |
| Secret   | `CLOUDFLARE_API_TOKEN`              | Token com edição de Cloudflare Pages, limitado à conta utilizada |
| Secret   | `CLOUDFLARE_ACCOUNT_ID`             | Identificador da conta dos dois projetos                         |
| Variable | `FRONTEND_API_URL`                  | `https://frotamanager-api.onrender.com`                          |
| Variable | `CLOUDFLARE_GESTOR_PROJECT_NAME`    | `frotamanager-gestor`                                            |
| Variable | `CLOUDFLARE_MOTORISTA_PROJECT_NAME` | `frotamanager-motorista`                                         |

Cadastre as credenciais diretamente no GitHub, sem enviá-las ao chat, ao repositório ou aos logs. Não use token global da conta. O token de Pages não precisa de acesso ao banco, à API Gemini ou ao DNS para enviar arquivos aos domínios `pages.dev`.

O Frontend CI valida lint, formatação, tipos, testes, build e E2E. A etapa de CD publica somente a `main` do repositório oficial depois dos checks exigidos. PRs e `dev` não publicam produção. Confira os dois resultados: sucesso de apenas um aplicativo não comprova que ambos foram atualizados.

| Aplicativo | Comando na pasta `frontend` | Diretório publicado |
| ---------- | --------------------------- | ------------------- |
| Gestor     | `npm run build:gestor`      | `dist/gestor`       |
| Motorista  | `npm run build:motorista`   | `dist/motorista`    |

O workflow usa Node de `frontend/.nvmrc` e `npm ci`. `FRONTEND_API_URL` é passada ao Vite como `VITE_API_URL` no build de publicação. Alterar a URL exige novo build. Nunca coloque senhas, tokens ou `DATABASE_URL` em variáveis `VITE_*`: elas podem entrar no JavaScript público.

Os E2E recompilam os aplicativos com `VITE_API_URL=/api`. Esses arquivos de teste **não podem ser publicados**. O CD deve usar o build de produção com a API real, sem reutilizar a saída do job E2E.

Pages fornece fallback SPA quando não há `404.html` na raiz da saída. Os aplicativos não precisam do rewrite Vercel para recarregar `/login`, `/veiculo-sessao` ou `/viagens`. Manifest, ícones, service worker e `offline.html` do motorista são arquivos estáticos. A instalação PWA continua online; não habilita envio offline.

## Domínios e CORS da API

Confirme os domínios efetivamente atribuídos no painel Cloudflare. Os nomes esperados são `https://frotamanager-gestor.pages.dev` e `https://frotamanager-motorista.pages.dev`; use os endereços reais dos projetos como referência.

No Render, acrescente as duas origens exatas a `CORS_ORIGINS`, separadas por vírgula e sem barra final. Preserve as origens Vercel durante validação e rollback. Não use `*` nem libere todos os subdomínios `pages.dev`. URLs de preview têm origens diferentes e não ficam autorizadas automaticamente.

As duas origens Pages foram adicionadas ao Render em 17/11/2026, mantendo Vercel e localhost. O preflight retornou 204 com a origem exata para ambos os aplicativos. CORS não concede permissões: 401 indica ausência/invalidade da sessão; 403 pode indicar falta de perfil ou permissão. Vínculo do cadastro de motorista não atribui automaticamente o perfil Motorista.

A mudança de origem não transfere a sessão salva nem a instalação PWA. Os usuários devem entrar novamente e, se utilizarem o aplicativo instalado, instalar a versão do novo domínio.

## Backend no Render

A migração do frontend não altera o backend nem move o banco. O [serviço Render](https://dashboard.render.com/web/srv-dbfkp6ajnfac73cog5sg) mantém o ambiente e o deploy hook existente.

`.github/workflows/backend-ci.yml` testa e compila o backend e, na `main` oficial, chama `RENDER_DEPLOY_HOOK_URL` com o SHA validado. O secret permanece apenas no GitHub. Resposta bem-sucedida do hook não significa publicação concluída: confira commit e status **Live** no Render.

Configuração: pasta `backend`, build `HUSKY=0 npm ci --include=dev && npm run build`, início `npm start`, health check `/health` e Node conforme `backend/.nvmrc`. Não habilite outro auto-deploy sem revisar se publicaria antes dos checks ou geraria deploys duplicados.

Valide [a saúde da API](https://frotamanager-api.onrender.com/health), login e uma operação autorizada. Health 200 não comprova que todas as migrations e operações funcionam. `ENABLE_PANEL_DEMO` deve ficar ausente ou `false` em produção.

## Neon e migrations

Commit, publicação e migration são operações diferentes. O deploy do Render não aplica migrations automaticamente. Antes de publicar código que dependa delas, confirme a base e execute as pendentes uma vez nesse ambiente.

Com `.env` local apontando conscientemente para a base correta:

```bash
cd backend
npm ci
npm run migrate:up
```

Não copie a conexão Neon para comandos compartilhados, documentos ou Git. Não use `migrate:down` em base compartilhada como tentativa de correção: pode remover dados e vínculos. Investigue o erro e prefira migration corretiva.

Migrations relevantes:

- `1793100000000_add-fleet-links.sql`: frota de veículos/motoristas, exclusividade SVO e `motoristas_veiculos`.
- `1793500000000_trip-status-transitions.sql`: transições, histórico e permissões de viagem.
- `1793600000000_add-driver-trip-captures.sql`: km e foto do painel por viagem.
- `1793700000000_add-driver-session-vehicle.sql`: veículo por sessão e marcação de painel simulado em desenvolvimento.

Migrations foram validadas no desenvolvimento durante a implementação; isso não comprova aplicação independente no banco de produção. Confira a base usada pelo Render.

`npm run seed:svo-demo` é exclusivo de demonstração/desenvolvimento e não deve integrar build/start de produção. Usa placas fictícias `SVO0A01`, `SVO0A02` e `SVO0A03`, com `ON CONFLICT DO NOTHING`; não sobrescreve registros existentes.

Motorista comum só vincula veículos da mesma frota; coringa pode vincular outras frotas, inclusive SVO. Remova vínculos incompatíveis antes de mudar frota ou desmarcar coringa. Exclusividade SVO não concede permissões de usuário.

## Validação e troca de hospedagem

Antes de considerar a migração concluída:

1. Confirme a mudança na `main` oficial e os checks aprovados.
2. Confira os dois projetos Cloudflare, o commit e o status de cada deployment.
3. Abra `/login` e recarregue rotas internas nos dois domínios. Confira manifest, ícones e service worker do motorista.
4. Confirme preflight/CORS para as origens finais, login e leituras autorizadas.
5. No mobile, valide identificação obrigatória, vínculo, recarregamento, logout e nova sessão; teste câmera em aparelho físico com HTTPS.
6. Confira persistência e fluxo de viagem com conta/dados de teste autorizados. Build verde não equivale à homologação do fluxo.
7. Após validar, atualize links divulgados e decida quando desativar deploys Vercel e sincronização exclusiva do fork.

Não exclua projetos Vercel nem remova suas origens CORS antes de confirmar o novo caminho. Registre o último commit funcional e os domínios publicados para permitir retorno.

## Rollback e configuração anterior da Vercel

Endereços anteriores: [gestor](https://frotamanager-gestor.vercel.app) e [motorista](https://frotamanager-motorista.vercel.app/login). Acompanham a `main` do fork `Gabriellin1227/Squad20_Residencia-III`; não presuma que recebem próximos commits oficiais depois da migração.

`frontend/vercel.json` e `npm run build:vercel` permanecem disponíveis. Ambos usam raiz `frontend`, saída `dist/vercel`, `VITE_API_URL` da API e `FROTAMANAGER_APP=gestor` ou `motorista`. Não use `VERCEL_APP`: o prefixo é reservado.

Para retornar temporariamente, divulgue novamente os endereços Vercel e confira compatibilidade com a API atual. Se precisar atualizar o fork, sincronize por merge revisado, sem force push e sem alterar autoria de commits. O workflow em `automation` pertence ao fluxo anterior; evite dois caminhos de produção sem decisão explícita.

## Desenvolvimento e envio

Trabalhe em branch de tarefa a partir de `dev` atualizada, respeitando alterações locais. Faça PR para `dev` e depois promova por PR para `main` oficial. Revise `git status`, `git diff` e o conteúdo staged antes de commitar. Não inclua `.env`, tokens, senhas ou conexões de banco.

Verificações usuais nas respectivas pastas:

```bash
cd backend
npm ci
npm run ci
npm run build
cd ../frontend
npm ci
npm run check
npm run test:e2e
```

A base visual mobile fornecida em ZIP é de Tarcísio Barreto. Integrações de API, sessão e painel estão em [MOBILE-INTEGRATION.md](MOBILE-INTEGRATION.md); suas referências de hospedagem Vercel descrevem a etapa anterior. Configuração Brevo, secrets e destinatários ficam em [EMAIL-ALERTS.md](EMAIL-ALERTS.md).

## Referências oficiais

- [Pages: Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Pages: integração com CI](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)
- [Pages: monorepos](https://developers.cloudflare.com/pages/configuration/monorepos/)
- [Pages: arquivos e fallback SPA](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- [Render: deploys](https://render.com/docs/deploys)
- [GitHub: sincronizar fork](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/syncing-a-fork)
