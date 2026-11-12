# Guia de publicação — FrotaManager

Este guia explica o fluxo da equipe, a sincronização do fork e a publicação do frontend na Vercel e do backend no Render. Atualizado em 26/10/2026.

## 1. O que cada serviço faz

| Serviço | Responsabilidade | Endereço |
| --- | --- | --- |
| Repositório principal | Código oficial da equipe; desenvolvimento na `dev`, versão demonstrável na `main` | https://github.com/Levi-Fabricio/Squad20_Residencia-III |
| Fork do Gabriel | Espelha a `main` principal para a publicação do frontend | https://github.com/Gabriellin1227/Squad20_Residencia-III |
| Vercel | Compila e hospeda o frontend do gestor | https://frotamanager-gestor.vercel.app |
| Render | Executa a API Node/Express | https://frotamanager-api.onrender.com |
| Neon | PostgreSQL com usuários, veículos, motoristas e vínculos | A conexão fica apenas no ambiente do backend |

Fluxo planejado:

```text
desenvolvimento → dev do principal → PR aprovado → main do principal
                                                    ├─ CI → Render → API
                                                    └─ workflow do fork → testes → main do fork → Vercel
```

Commit envia código ao Git. Deploy publica esse código em um serviço. Migração altera a estrutura do banco. São três operações diferentes. Criar um administrador altera o banco: não precisa de commit por causa do usuário criado; scripts e mudanças no código precisam de commit.

## 2. Estado e pendências conhecidas

- O fork existe. Sua branch padrão é `automation`, que contém o workflow de sincronização. A branch `main` é o espelho do principal.
- O workflow `.github/workflows/sync-and-deploy.yml` está na branch `automation`. A primeira execução de sincronização/testes concluiu com sucesso.
- Na última consulta, o fork **não tinha o secret `VERCEL_TOKEN`**. Nesse estado, o workflow pode concluir verde e pular a publicação com um aviso. Verde não comprova que o frontend foi publicado.
- A Vercel foi conectada ao fork e configurada para usar a pasta `frontend`. Confira a branch de produção e a variável da API conforme a seção 5 antes de contar com a publicação automática.
- O Render foi configurado para acompanhar a `main` do repositório principal, com auto-deploy após os checks. Acompanhe o deploy na interface: teste local ou CI verde não comprova que o serviço ficou Live.
- As mudanças locais de frota/vínculos precisam ser commitadas e chegar à `main` para atualizar os serviços. A migração e os três veículos de demonstração já foram aplicados ao Neon de desenvolvimento durante esta implementação.

## 3. Rotina de desenvolvimento e envio ao principal

Na pasta do projeto, confira primeiro o que será enviado:

```bash
git status
git diff
```

Trabalhe em uma branch de tarefa criada a partir de uma `dev` atualizada. Faça pull com a árvore de trabalho limpa; se houver alterações locais, termine seu commit ou use stash conscientemente antes.

```bash
git switch dev
git pull --ff-only origin dev
git switch -c feat/nome-da-tarefa
```

Implemente e valide:

```bash
cd backend
npm ci
npm run ci
npm run build
cd ../frontend
npm ci
npm run check
npx playwright install --with-deps chromium
npm run test:e2e
cd ..
```

Adicione apenas os arquivos que revisou. Exemplo de um arquivo específico:

```bash
git add caminho/do/arquivo
git diff --cached
git commit -m "feat: descreve a alteração"
git push -u origin feat/nome-da-tarefa
```

Abra PR da sua branch para `dev`. Depois dos testes da equipe, abra PR **de `dev` para `main` no repositório principal**. Espere os checks passarem e faça o merge. A `dev` é para integração e testes; apenas a `main` deve alimentar a demonstração estável.

Não envie `.env`, senhas, tokens ou a conexão do Neon ao Git. A senha do administrador não entra no repositório.

## 4. Como trazer a main principal para o fork

### Caminho automático configurado

1. Faça o merge na `main` de `Levi-Fabricio/Squad20_Residencia-III`.
2. Abra [Actions do fork](https://github.com/Gabriellin1227/Squad20_Residencia-III/actions).
3. Selecione **Sync upstream and deploy frontend**.
4. O agendamento consulta alterações aproximadamente a cada 15 minutos. O GitHub pode atrasar execuções; não é uma garantia de prazo.
5. Se houver novo commit, o workflow busca aquele SHA, testa backend e frontend e atualiza a `main` do fork sem forçar o histórico.
6. Com as credenciais configuradas, executa a etapa de publicação na Vercel. Confira o resumo e os logs dessa etapa.

Para adiantar a execução: **Run workflow → branch `automation` → Run workflow**. Não selecione `main`: o workflow específico mora em `automation`.

Evite commits próprios na `main` do fork. Eles podem impedir o avanço simples do espelho. Mantenha o código de produto no principal e a configuração exclusiva do fork na `automation`. Não faça merge de `automation` na `main` do principal.

### Alternativa manual pelo GitHub

1. Abra o fork e selecione explicitamente a branch **`main`** (a padrão é `automation`).
2. Use **Sync fork → Update branch**.
3. Se houver conflito, resolva-o por PR. Não descarte commits usando force sem revisar a divergência.
4. Depois rode o workflow pela branch `automation`, para executar os testes e a publicação. Atualizar a branch manualmente não comprova deploy.

### Alternativa por terminal

A opção abaixo usa GitHub CLI autenticado, sem trocar os remotes locais:

```bash
gh repo sync Gabriellin1227/Squad20_Residencia-III --source Levi-Fabricio/Squad20_Residencia-III --branch main
gh workflow run sync-and-deploy.yml --repo Gabriellin1227/Squad20_Residencia-III --ref automation
```

Se falhar por divergência ou permissão, leia a mensagem. Não acrescente `--force` para tentar resolver automaticamente.

## 5. Frontend na Vercel

Projeto: `frotamanager-gestor`, no workspace `gabriel-lins-projects-63c6b5dd`.

Em **Settings → Git**, confira o repositório `Gabriellin1227/Squad20_Residencia-III`. Em **Settings → Environments → Production**, confira **Production Branch = `main`**, pois a branch padrão do fork é `automation`.

Em **Settings → Build and Deployment**, confira:

| Configuração | Valor |
| --- | --- |
| Framework | Vite |
| Root Directory | `frontend` |
| Node.js | 24.x |
| Install Command | `npm ci` |
| Build Command | `npm run typecheck && npm run build:gestor` |
| Output Directory | `dist/gestor` |

Em **Settings → Environment Variables**, configure para Production:

```text
VITE_API_URL=https://frotamanager-api.onrender.com
```

O Vite incorpora essa URL no build. Depois de mudar a variável, faça novo deploy. Nunca coloque `DATABASE_URL`, tokens ou senhas em variáveis `VITE_*`: elas podem ser expostas no JavaScript entregue ao navegador.

### Publicação pelo workflow do fork

O workflow foi preparado para autenticar pela sua conta Vercel e enviar o frontend compilado. Isso também evita depender da autoria dos commits da equipe para a integração Git no plano Hobby.

1. Entre na Vercel e abra **Account Settings → Tokens**.
2. Crie um token com acesso ao workspace do projeto. Defina uma validade adequada e guarde a data para renová-lo.
3. No fork, abra **Settings → Secrets and variables → Actions → Secrets → New repository secret**.
4. Nome: `VERCEL_TOKEN`. Cole o valor diretamente no GitHub; não o envie no chat nem em arquivos do projeto.
5. Em **Variables**, confira:

```text
VERCEL_ORG_ID=team_xDBPnKnaMtTCrb1b43fYbFGA
VERCEL_PROJECT_ID=prj_HphYcowxwp9cDXqZrnYUB9jhKhO0
```

6. Rode o workflow pela branch `automation`.
7. Confira a etapa **Publish to the existing Vercel project**: ela deve publicar uma URL, sem aviso de credencial ausente.
8. Na Vercel, confira o novo deploy como **Ready**, o projeto correto e o domínio de produção.
9. Abra `/login`, atualize a página nessa rota e teste o acesso com sua conta.

A primeira publicação via token ainda precisa ser validada. Se o envio da pasta compilada herdar Root Directory/Build Command incompatíveis do projeto, a etapa de CLI precisará ser ajustada antes de considerar o fluxo concluído. Não trate apenas o token cadastrado como prova de funcionamento.

A integração Git da Vercel também pode disparar um build ao atualizar `main`. Caso surjam builds duplicados ou restrições de autoria do Hobby, valide primeiro a publicação pelo Actions e depois escolha um único caminho de produção. Não altere autor de commits para contornar restrições.

### Atualização somente no frontend

Faça PR/merge no principal, sincronize o fork e acompanhe o workflow/Vercel. Não precisa reiniciar o Neon nem recriar o administrador. O build do gestor é separado do app motorista: este projeto publica `dist/gestor`.

## 6. Backend no Render

Serviço: `frotamanager-api`.

[Abra o serviço](https://dashboard.render.com/web/srv-dbfkp6ajnfac73cog5sg).

Em **Settings**, confira:

| Configuração | Valor |
| --- | --- |
| Repository | `Levi-Fabricio/Squad20_Residencia-III` |
| Branch | `main` |
| Root Directory | `backend` |
| Node.js | 24.x, conforme `.nvmrc` |
| Build Command | `HUSKY=0 npm ci --include=dev && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/health` |
| Auto-Deploy | `After CI Checks Pass` |

Em **Environment**, mantenha a conexão `DATABASE_URL` do Neon e as variáveis exigidas pela API. Para a política de CORS, configure `CORS_ORIGINS` com as origens separadas por vírgula, sem barra final, conforme `backend/src/config/cors.ts`. O domínio do frontend de demonstração é:

```text
https://frotamanager-gestor.vercel.app
```

CORS libera a origem do navegador; não substitui login nem permissões. Se o domínio do frontend mudar, atualize a lista de origens permitidas no Render. Nunca use `*` como solução automática para erros de autenticação.

### Atualização somente no backend

1. Faça PR/merge para `main` no principal.
2. Confira o **Backend CI** no GitHub.
3. No Render, abra **Events/Deploys** e verifique qual commit foi usado.
4. Aguarde o status **Live**. Se o serviço foi importado apenas por URL pública, sem integração Git, auto-deploy pode não estar disponível: conecte o provedor Git nas configurações.
5. Teste `https://frotamanager-api.onrender.com/health`.
6. Teste o login e uma rota funcional. Health 200 não comprova que o esquema do banco e todas as operações estão corretos.

Para repetir uma publicação, use **Manual Deploy → Deploy latest commit**, com a branch `main` correta. O Render não depende de sincronizar o fork neste desenho: ele usa o principal diretamente.

## 7. Banco Neon, migrações e os três veículos SVO

O build do Render listado acima **não aplica migrações automaticamente**. Cada mudança de estrutura precisa de uma migration versionada. Execute-a uma vez no banco correto, antes de publicar código que dependa das novas colunas.

Com o código atualizado e o `.env` local apontando para o Neon desejado:

```bash
cd backend
npm ci
npm run migrate:up
```

Não copie a URL do banco para o guia, Git ou comandos que serão compartilhados. Não rode `migrate:down` em um banco compartilhado para tentar corrigir falhas: o rollback pode remover colunas e vínculos. Revise o erro ou crie uma migração de correção.

A mudança de frota usa `1793100000000_add-fleet-links.sql`: frota em veículos/motoristas, flag de exclusividade SVO e tabela `motoristas_veiculos`. Cadastros antigos ficam sem frota até serem classificados; nenhuma frota é presumida para eles.

Somente no banco de demonstração, para inserir os registros genéricos:

```bash
npm run seed:svo-demo
```

Placas: `SVO0A01`, `SVO0A02`, `SVO0A03`. São dados fictícios, todos SVO e exclusivos SVO. O INSERT usa `ON CONFLICT DO NOTHING`, portanto repetir não duplica as placas nem sobrescreve registros. Eles já foram inseridos no Neon de desenvolvimento durante esta implementação. Não inclua esse seed no start/build de produção.

Regra dos vínculos: motorista comum só vincula veículos da mesma frota; coringa pode vincular veículos de todas as frotas, inclusive SVO. Se mudar frota ou desmarcar coringa, remova primeiro os vínculos incompatíveis. O sistema rejeita a operação se eles permanecerem. Exclusividade SVO não concede permissões de usuário: os perfis e as permissões existentes continuam valendo.

## 8. Como verificar uma publicação completa

- **Código:** o commit esperado chegou à `main` do principal? E à `main` do fork?
- **Actions:** testes passaram? A etapa de publicação realmente executou ou pulou por falta de token?
- **Render:** deploy do commit correto está Live? `/health` responde? Login e leituras funcionam?
- **Vercel:** deploy está Ready e no domínio de produção? `VITE_API_URL` aponta para a API correta?
- **Banco:** migrations necessárias aplicadas? Cadastro, edição e vínculos persistem depois de recarregar a página?
- **Navegador:** se houver CORS, confira origem permitida no backend; se houver 401, confira sessão/login; 403 indica falta de permissão. Não resolva esses casos expondo credenciais no frontend.

## 9. Falhas comuns

| Sintoma | O que conferir |
| --- | --- |
| Funciona local e falha no CI | `npm ci`, versões do Node, formatação, tipagem e arquivos realmente commitados |
| Fork não recebe alterações | PR chegou à `main`? Workflow habilitado na `automation`? Divergência na `main` do fork? |
| Workflow verde, site antigo | Etapa Publish pulou por falta de token? Domínio aponta para o deploy correto? |
| Vercel reclama de `package.json`/pasta | Root Directory `frontend`; se for envio de artefato via CLI, revisar compatibilidade com settings do projeto |
| Erro de autor no Hobby | Limitação da integração Git; conferir o caminho autorizado via token/CLI |
| Render não atualiza | Branch/repositório corretos, CI concluído, Auto-Deploy e integração Git |
| API acusa coluna/tabela inexistente | Migration não foi aplicada ao banco usado pelo Render |
| Atualizar página em `/login` retorna 404 | Rewrite de SPA para `/index.html` no projeto Vercel |
| Vínculo SVO recusado | Frota do motorista, frota do veículo e flag coringa; não remover a proteção do banco |

## Referências oficiais

- [GitHub: sincronizar um fork](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/syncing-a-fork)
- [Render: deploys e auto-deploy após CI](https://render.com/docs/deploys)
- [Vercel: integração Git](https://vercel.com/docs/git)
- [Vercel CLI: deploy](https://vercel.com/docs/cli/deploy)

## Alertas por e-mail

A configuração do Brevo, os secrets do GitHub Actions e as regras de destinatários estão em [EMAIL-ALERTS.md](EMAIL-ALERTS.md).

## Mobile no Vercel (configuração atualizada em 12/11/2026)

Gestor e motorista são dois projetos Vercel do mesmo repositório, ambos com **Root Directory `frontend`**. Cada projeto recebe suas próprias variáveis e domínio. A configuração em `frontend/vercel.json` agora executa `npm run build:vercel` e publica `dist/vercel`; o script escolhe o app por `FROTAMANAGER_APP`. Sem essa variável, mantém o gestor como padrão.

| Configuração | Gestor | Motorista |
| --- | --- | --- |
| Nome sugerido | `frotamanager-gestor` | `frotamanager-motorista` |
| Framework | Vite | Vite |
| Root Directory | `frontend` | `frontend` |
| Install Command | `npm ci` | `npm ci` |
| Build Command (vercel.json) | `npm run build:vercel` | `npm run build:vercel` |
| Output Directory (vercel.json) | `dist/vercel` | `dist/vercel` |
| `FROTAMANAGER_APP` | `gestor` (ou ausente) | `motorista` |
| `VITE_API_URL` | URL HTTPS da API | A mesma URL HTTPS da API |
| Production Branch | `main` | `main` |

Crie o segundo projeto por **Add New → Project**, importe o repositório que efetivamente recebe os commits e configure as variáveis para Production e Preview. O gestor atual acompanha o fork: se o mobile também usar esse fork, sincronize nele a release depois de integrar o PR na main oficial. Não presuma que o PR aberto no repositório da equipe já atualizou a main do fork.

O arquivo JSON versionado prevalece sobre o comando/output configurados no painel. Não configure o projeto mobile com `build:motorista` e `dist/motorista` mantendo um JSON que manda construir o gestor; use a seleção `FROTAMANAGER_APP=motorista` com o script compartilhado. O build gera manifest, ícones e service worker do app escolhido. As rewrites existentes permitem abrir e recarregar `/veiculo-sessao` e `/viagens` diretamente.

No backend publicado, acrescente a origem exata do domínio mobile em `CORS_ORIGINS`, mantendo a do gestor. Exemplo ilustrativo (substitua pelo domínio atribuído pelo Vercel):

```text
CORS_ORIGINS=https://frotamanager-gestor.vercel.app,https://SEU-MOBILE.vercel.app
```

A API deve executar a versão do PR e as migrations `1793600000000` e `1793700000000` no banco correspondente. A aplicação dessas migrations foi validada apenas no desenvolvimento; não foi aplicada automaticamente em produção. `ENABLE_PANEL_DEMO` deve ficar ausente ou `false` em produção. O banco continua acessível somente pelo backend: não cadastre `DATABASE_URL` nem chave Gemini no Vercel do frontend.

Depois de publicar: confirme o deploy Ready e o SHA, teste login → identificação obrigatória → vínculo, recarregue uma rota interna, teste logout e uma nova sessão e confira a câmera em aparelho físico com HTTPS. Não trate build aprovado como prova de que a API e o CORS de produção estão conectados. O aplicativo permanece online; instalar como PWA não habilita envio offline.

Referências: [monorepos Vercel](https://vercel.com/docs/monorepos), [configuração por vercel.json](https://vercel.com/docs/project-configuration/vercel-json).
