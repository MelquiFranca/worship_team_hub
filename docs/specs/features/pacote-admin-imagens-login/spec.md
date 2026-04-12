# Spec Funcional - pacote-admin-imagens-login

## 1) Contexto

- Data: 2026-04-12
- Autor(a): Codex
- Status: Proposed
- Stakeholders: Produto, Frontend, Lideranca, Administracao

## 2) Problema

A aplicacao ainda nao possui:
- bloco de imagem por escala no card do feed,
- separacao clara de autenticacao entre usuario comum e administrador,
- tela de grupos para visao administrativa,
- menu principal administrativo dedicado.

Tambem existem elementos de login fora do escopo atual (`Facebook` e `Cadastre-se`) que precisam ser removidos.

## 3) Objetivo

Entregar um fluxo administrativo e operacional completo com:
- bloco de imagens por escala (1 imagem por escala + reaproveitamento de imagens historicas),
- login simplificado para usuario comum,
- login separado para administrador,
- tela de grupos com dados ficticios,
- menu principal da visao admin com `Configuracoes`, `Adicionar` (Novo grupo) e avatar.

## 4) Escopo

- Adicionar botao iconico `Imagens` no grupo esquerdo do rodape do card de escalas, na ultima posicao.
- Criar view `Imagens` no card de escalas com suporte a somente 1 imagem selecionada por escala.
- Exibir estado vazio da imagem com:
  - botao para adicionar imagem,
  - seletor de imagens anteriores vinculadas a outras escalas.
- Remover botao de login com Facebook e bloco `Cadastre-se` da tela de login atual.
- Criar tela de login da visao admin em rota separada (ex.: `/admin/login`), mantendo identidade visual consistente.
- Criar tela de grupos admin com listagem de grupos mockados (imagem, nome, status ativo/inativo).
- Criar menu principal da visao admin com os botoes:
  - `Configuracoes`
  - `Adicionar` com menu flutuante contendo `Novo grupo`
  - avatar do perfil logado.

## 5) Nao-Escopo

- Upload real para storage externo.
- Persistencia backend real de imagem/grupos/autenticacao.
- Controle de permissao granular por perfil.
- CRUD completo de grupos (nesta fase, apenas listagem e atalho para criar).

## 6) Usuarios e Cenarios

- Usuario comum:
  - acessa login sem social,
  - abre card de escala e visualiza/define imagem da escala.
- Administrador:
  - autentica em rota dedicada,
  - visualiza lista de grupos,
  - acessa menu admin e atalho `Novo grupo`.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Rodape do card de escalas possui novo botao `Imagens` no grupo esquerdo, na ultima posicao. | Teste visual no feed. | Alta |
| AC-02 | Ao abrir `Imagens`, o card exibe apenas 1 imagem por escala quando existir vinculacao. | Teste manual de render da escala com imagem. | Alta |
| AC-03 | Se a escala nao tiver imagem vinculada, a UI exibe `Adicionar imagem` e `Escolher imagem anterior`. | Teste manual no estado vazio. | Alta |
| AC-04 | Selecao de imagem anterior atualiza a imagem da escala atual localmente sem afetar outras escalas. | Teste de integracao com multiplos cards. | Alta |
| AC-05 | Tela de login principal nao exibe `Entrar com Facebook` nem `Cadastre-se`. | Teste visual na rota `/login`. | Alta |
| AC-06 | Existe rota de login administrativo separada da rota de login principal. | Navegacao e render em `/admin/login`. | Alta |
| AC-07 | Tela de grupos admin lista grupos mock com imagem, nome e status (`Ativo`/`Inativo`). | Teste visual e inspeção dos dados mock. | Alta |
| AC-08 | Menu principal admin exibe `Configuracoes`, `Adicionar` com menu flutuante (`Novo grupo`) e avatar. | Teste visual/interacao em rotas admin. | Alta |
| AC-09 | Menu principal atual nao conflita com o menu admin (sem sobreposicao de navegacao). | Teste de navegacao cruzada entre visoes. | Media |
| AC-10 | Todos os novos controles mantem acessibilidade minima (`aria-label`, foco visivel, navegação por teclado). | Checklist a11y manual. | Media |

## 8) Requisitos Nao Funcionais

- Performance: troca de views do card e abertura de menus em tempo percebido imediato.
- Seguranca: mocks sem exposicao de dados sensiveis; separar claramente login admin e comum por rota.
- Acessibilidade: foco visivel, labels acessiveis e navegacao por teclado.
- Observabilidade: eventos locais para `open_scale_images`, `select_previous_image`, `open_admin_menu`.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Nenhuma imagem historica disponivel para reaproveitamento | Exibir mensagem orientativa e manter apenas acao `Adicionar imagem`. |
| ER-02 | Imagem vinculada invalida (URL quebrada) | Exibir placeholder e opcao de trocar/remover imagem. |
| ER-03 | Navegacao para rota admin sem estado de autenticacao | Exibir tela de login admin (mock) e bloquear conteudo administrativo. |
| ER-04 | Menus de navegacao comuns/admin competindo na mesma tela | Renderizar somente o menu correspondente ao contexto da rota. |

## 10) Dependencias e Restricoes

- Dependencias atuais:
  - `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
  - `src/components/organisms/ScaleFeed/ScaleFeed.module.css`
  - `src/data/scales.js`
  - `src/components/organisms/LoginCard/LoginCard.jsx`
  - `src/components/organisms/LoginCard/LoginCard.module.css`
  - `src/components/organisms/MainBottomNav/MainBottomNav.jsx`
- Restricoes:
  - manter consistencia visual com tema atual.
  - nao introduzir dependencia pesada apenas para upload/galeria nesta fase.

## 11) Suposicoes

- `scales` pode receber novo campo `image` sem quebrar telas existentes.
- Fluxos de admin podem usar dados mock e estado de sessao local no inicio.
- A rota admin pode reutilizar `LoginCard` com variacao por props, evitando duplicacao grande.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-02, T-03 |
| AC-03 | T-03 |
| AC-04 | T-03, T-04 |
| AC-05 | T-05 |
| AC-06 | T-06 |
| AC-07 | T-07 |
| AC-08 | T-08 |
| AC-09 | T-08, T-09 |
| AC-10 | T-04, T-05, T-06, T-08, T-09 |
