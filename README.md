# Squad20_Residencia-III
Repositório para o "Sistema de Gestão de Frota com Módulo de Verificação de Óbito (SVO)" 


## Acesso pelo celular na rede local

Com o backend disponível na porta 3000, execute no diretório `frontend`:

```sh
npm run dev
```

Configure `frontend/.env.local` com `VITE_API_URL=/api`. O Vite encaminha
as chamadas `/api` ao backend local, tanto no gestor quanto no motorista.
Para hospedagem, configure `VITE_API_URL` com a URL pública da API.

No celular conectado ao mesmo Wi-Fi do computador, abra:

- Gestor: `http://IP-DO-COMPUTADOR:5173`
- Motorista: `http://IP-DO-COMPUTADOR:5175`

Use `hostname -I` no computador para consultar o IP da rede local.
Mantenha o computador e os servidores ligados. A porta 5175 evita o conflito
com outro projeto que utiliza a porta 5174 nesta máquina.
