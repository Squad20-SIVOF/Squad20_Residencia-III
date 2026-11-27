# FrotaManager — Mapa de Rotas (Gestor)

Projeto reorganizado segundo o documento **Convenções de Frontend — FrotaManager**. Este ZIP contém somente o app Gestor, pois o projeto enviado implementava a tela de monitoramento de viagens; não foi criado um app Motorista fictício.

## Estrutura

```text
apps/
  gestor/
    index.html
src/
  entries/gestor.tsx
  components/                 # componentes compartilhados
    Sidebar/
    StateMessage/
  hooks/                       # hooks genéricos
  layouts/                     # estrutura do Gestor
  pages/trips/                  # módulo de viagens
    components/                 # TripCard, RouteMap
    hooks/                      # useTrips, useTripFilters
    services/tripService.ts     # mock assíncrono; ponto de integração da API
    types.ts
  routes/
  styles/                       # tokens e estilos globais
  test/
e2e/
```

## Requisitos

- Node.js 20 ou superior recomendado
- npm

## Executar

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173/viagens`.

## Verificações

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check
```

## O que foi preservado

- Quatro viagens e suas coordenadas do projeto original.
- Pesquisa por rota, placa, motorista, origem e destino.
- Seleção de viagem, enquadramento da rota e mapa Leaflet/OpenStreetMap.
- Layout responsivo, menu lateral e estados de carregamento, erro e vazio.

## Integração com backend

A função `getTrips` em `src/pages/trips/services/tripService.ts` é o ponto único de acesso aos dados. Ela retorna mock assíncrono com o tipo `Trip`. Quando a API estiver disponível, substitua o corpo do serviço pela chamada HTTP, converta a resposta externa para `Trip` no próprio serviço e use `VITE_API_URL` como URL base. Não coloque requisições dentro dos componentes.

## Observações

- O mapa usa tiles do OpenStreetMap e exige conexão com a internet.
- As coordenadas preservadas são dados de demonstração e não representam telemetria GPS em tempo real.
- O projeto foi convertido para TypeScript e SCSS Modules. A arquitetura multi-app completa do documento (incluindo o app Motorista) deve ser aplicada quando o código desse segundo app for fornecido.


## Tema claro e escuro

O tema pode ser alternado pelo botão no menu lateral. A preferência é persistida em `localStorage` (`frota-theme`) e aplicada em `document.documentElement` pelo atributo `data-theme`. As cores compartilhadas ficam em variáveis CSS definidas em `src/styles/global.scss` e consumidas pelos tokens SCSS. O mapa Leaflet alterna entre os tiles claros do OpenStreetMap e o tema escuro do CARTO.

## Telas integradas

A aplicação reúne o monitoramento e os detalhes de viagem no mesmo projeto e compartilha o layout, a navegação lateral e o tema claro/escuro.

- `/viagens`: monitoramento, busca, seleção de viagem e mapa.
- `/viagens/:tripId`: detalhes da rota selecionada, com link para voltar ao monitoramento.

Na tela de monitoramento, selecione uma viagem e use **Ver detalhes da rota** para abrir a segunda tela. Os dados da tela de detalhes ainda são demonstrativos e devem ser conectados ao serviço de viagens da aplicação para exibir informações reais por identificador.
