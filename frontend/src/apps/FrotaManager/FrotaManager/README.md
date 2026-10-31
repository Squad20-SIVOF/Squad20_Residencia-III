# FrotaManager — Gestor

Aplicação React + Vite reorganizada a partir do projeto enviado.

## Executar

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Estrutura atual

```text
src/
  entries/gestor.jsx             # ponto de entrada do app Gestor
  App.jsx                        # composição raiz
  pages/vehicles/                # telas e fluxos do módulo Veículos
    VehiclesPage.jsx
    components/                  # componentes exclusivos do módulo
  layouts/                       # estrutura compartilhada (extração futura)
  hooks/                         # hooks compartilhados
  services/vehicleService.js     # leitura e persistência dos veículos
  styles/                        # estilos globais e tokens
  utils/format.js                # formatadores compartilhados
```

## Observações sobre a convenção de frontend

- O ZIP de origem contém somente o app Gestor em JavaScript/JSX. Por isso, esta reorganização preserva React + Vite e não inventa um app Motorista que não estava no material enviado.
- O documento de referência especifica React 19, TypeScript, SCSS Modules, React Router, Vitest e Playwright. A migração dessas tecnologias é uma etapa separada; este pacote mantém as dependências e o comportamento existentes para reduzir o risco de quebrar as telas.
- A lógica de persistência dos veículos foi separada em `services/vehicleService.js`; a tela foi movida para `pages/vehicles/`.
- Não foi incluída pasta `node_modules` nem `dist`; execute `npm install` antes de iniciar.
