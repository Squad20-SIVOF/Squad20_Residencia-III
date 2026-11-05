# Integração dos cadastros

As migrações `1793400000000` a `1793400000002` adicionam os campos sem remover dados existentes. Execute `npm run migrate:up` em `backend` antes de iniciar uma nova instalação. Na base configurada neste ambiente, elas já foram aplicadas.

## Gestor

- Veículos: marca, identificação interna, data da próxima vistoria e checklist persistidos. A capacidade aceita somente inteiros positivos no frontend e na API. A listagem oferece exclusão com confirmação.
- Motoristas: categoria ACC disponível, telefone, e-mail e foto opcionais, persistidos pelo cadastro e edição. Fotos JPG/PNG de até 5 MB ficam em formato data URL no banco.
- Perfil da conta: e-mail, telefone, departamento, cargo, matrícula e foto persistidos em `PUT /auth/profile`. A troca de senha exige de 12 a 256 caracteres. A data da alteração passa a ser registrada; datas antigas desconhecidas não são inventadas.
- Abastecimentos: listagem com filtro por mês, veículo e busca; criação, edição e exclusão em `/abastecimentos`. O servidor calcula `valor_total` a partir de litros e preço, sinaliza ultrapassagem do teto e só aumenta o hodômetro. Editar/excluir um abastecimento não reduz automaticamente a quilometragem do veículo.

Permissões de abastecimento do gestor: `abastecimentos:ler` e `abastecimentos:gerenciar`. Administrador e Gestor de Frota recebem essas permissões nas migrações. Auxiliares podem recebê-las por delegação. Permissões de criação e de leitura dos outros cadastros continuam sendo verificadas pela API.

## Motorista no app mobile

1. Cadastre o motorista e vincule os veículos no cadastro de motoristas.
2. Em **Usuários e permissões**, crie ou selecione a conta e atribua o perfil **Motorista**.
3. Em **Vincular conta a motorista**, associe a conta ao cadastro correto. Cada motorista só pode estar vinculado a uma conta; uma conta só pode representar um motorista.
4. No app da porta 5175, entre com essa conta e abra **Abastecer**. O responsável é identificado pela sessão e não pode ser substituído no payload. Apenas veículos vinculados ao motorista estão disponíveis; motoristas coringas podem selecionar qualquer veículo ativo.
5. O checklist de vistoria mobile persiste os itens no veículo e aparece nos detalhes do veículo no gestor. É o checklist atual, sem histórico de vistorias anteriores.

Endpoints mobile: `GET /motorista/abastecimentos/opcoes`, `GET /motorista/abastecimentos/resumo`, `POST /motorista/abastecimentos`, `GET/POST /motorista/vistorias`. As permissões `abastecimentos:criar-proprio` e `veiculos:vistoriar-proprios` são atribuídas ao perfil Motorista. Conta sem vínculo recebe uma mensagem de configuração, sem registrar em nome de um motorista fictício.

## Carregamento

O texto de validação de sessão foi substituído por um skeleton visual sem dados privados. O conteúdo aparece com uma transição curta de blur para nítido. A preferência por redução de movimento é respeitada. Chamadas à API têm limite padrão de 20 segundos.

Solicitação/acompanhamento de viagens ficaram fora desta alteração, conforme solicitado. Os dados de exemplo da página inicial/viagens do motorista continuam no serviço de demonstração; o perfil, o abastecimento e a vistoria mobile consultam a API.
