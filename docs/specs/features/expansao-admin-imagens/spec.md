# Spec Funcional - expansao-admin-imagens

## 1) Contexto

- Data: 2026-04-12
- Autor(a): Codex
- Status: Proposed
- Stakeholders: Produto, Frontend, Lideranca, Administracao

## 2) Problema

A aplicacao ainda nao possui separacao clara entre experiencia de usuario de grupo e experiencia administrativa. Tambem falta um bloco visual para imagem da escala no card, e a tela de login atual mantem opcoes fora do escopo imediato (Facebook e cadastro).

## 3) Objetivo

Entregar um fluxo completo para evoluir o produto em 5 frentes:

- Bloco de imagem no card de escala, com suporte inicial a uma unica imagem por escala e reutilizacao de imagens anteriores.
- Simplificacao do login atual (sem Facebook e sem Cadastre-se).
- Nova tela de login administrativa em rota separada.
- Nova tela de grupos com dados ficticios.
- Menu principal administrativo com acoes `Configuracoes`, `Adicionar -> Novo grupo` e avatar.

## 4) Escopo

- Adicionar botao iconico de `Imagem` no grupo esquerdo do rodape do card de escala, na ultima posicao.
- Criar view de imagem no card de escala (similar a `Componentes`, `Playlist`, `Comentarios`).
- Permitir apenas 1 imagem por escala na fase inicial.
- Caso sem imagem na escala: exibir CTA de adicionar imagem nova e opcao de selecionar imagem existente de outras escalas.
- Ajustar login atual removendo botao Facebook e bloco `Cadastre-se`.
- Criar rota de login admin separada, reaproveitando a base visual do login atual.
- Criar rota de grupos admin com listagem mock (imagem, nome, status ativo/inativo).
- Criar menu principal da visao admin com botoes definidos no requisito.
- Definir mocks de dados para grupos e imagens reutilizaveis.

## 5) Nao-Escopo

- Persistencia backend real (auth, grupos ou imagens) nesta fase.
- Upload real de imagem para storage remoto.
- Controle de permissao real com JWT/ACL.
- Paginação, busca e filtros avancados na tela de grupos.
- Cadastro completo de grupo (apenas entrada de menu e fluxo inicial).

## 6) Usuarios e Cenarios

- Usuario-alvo 1: membro/lider do grupo (app atual).
- Usuario-alvo 2: administrador do sistema (nova visao admin).
- Cenarios principais:
  - Lider abre escala, entra na view de imagem e vincula uma imagem existente.
  - Lider sem imagem vinculada visualiza CTA para adicionar e para escolher imagem anterior.
  - Usuario de grupo entra no login simplificado.
  - Administrador entra por login separado e acessa tela de grupos.
  - Administrador abre menu principal, vai para configuracoes, adiciona novo grupo e acessa menu de avatar.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | O rodape esquerdo do card de escala possui novo botao de imagem na ultima posicao. | Teste visual em `ScaleFeed`. | Alta |
| AC-02 | A view de imagem permite vincular no maximo 1 imagem por escala. | Teste de interacao local. | Alta |
| AC-03 | Sem imagem vinculada, a UI mostra CTA para adicionar e lista de imagens anteriores (mock). | Teste manual de estado vazio. | Alta |
| AC-04 | Login atual nao exibe botao Facebook nem link `Cadastre-se`. | Teste visual da tela `/login`. | Alta |
| AC-05 | Existe login administrativo separado em rota propria e funcionalmente isolada da rota `/login`. | Teste de navegacao entre `/login` e `/admin/login`. | Alta |
| AC-06 | Tela `/admin/grupos` lista todos os grupos mock com imagem, nome e status (ativo/inativo). | Teste visual e de renderizacao de lista. | Alta |
| AC-07 | Menu principal admin exibe `Configuracoes`, `Adicionar` com `Novo grupo` e avatar do perfil logado. | Teste visual e interacao de menu. | Alta |
| AC-08 | Navegacao/admin nao interfere no menu atual da visao de grupo. | Teste de regressao entre rotas de grupo e admin. | Media |
| AC-09 | Fluxos novos mantem acessibilidade minima (aria-label, foco visivel, tab order). | Teste manual a11y. | Media |

## 8) Requisitos Nao Funcionais

- Performance: trocas de view no card e menus sem travamentos perceptiveis.
- Seguranca: nao expor dados sensiveis nos mocks; manter separacao de rotas admin.
- Acessibilidade: botoes iconicos com `aria-label`, foco visivel e ordem de tab previsivel.
- Observabilidade: registrar eventos locais de `open_scale_image_view`, `select_scale_image`, `admin_login_success`, `open_admin_add_menu`.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Escala sem imagem e sem biblioteca anterior | Exibir estado vazio orientativo com CTA de adicionar. |
| ER-02 | Tentativa de inserir segunda imagem na mesma escala | Bloquear acao e orientar substituicao/remocao da atual. |
| ER-03 | Imagem mock invalida/quebrada | Exibir fallback visual e manter item selecionavel quando possivel. |
| ER-04 | Acesso direto em rota admin sem estado de login admin | Redirecionar para `/admin/login` (mock gate simples). |
| ER-05 | Menu admin abrir em viewport pequena | Reposicionar menu sem overflow horizontal. |

## 10) Dependencias e Restricoes

- Dependencias de codigo:
  - `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
  - `src/components/organisms/ScaleFeed/ScaleFeed.module.css`
  - `src/components/organisms/LoginCard/LoginCard.jsx`
  - `src/components/organisms/LoginCard/LoginCard.module.css`
  - `src/components/organisms/MainBottomNav/MainBottomNav.jsx`
  - `src/components/organisms/MainBottomNav/MainBottomNav.module.css`
  - `src/app/layout.js`
  - `src/data/scales.js`
- Restricoes:
  - Manter compatibilidade com estrutura atual baseada em App Router.
  - Evitar introduzir dependencia externa desnecessaria para UI.

## 11) Suposicoes

- Mock de autenticacao admin pode usar `sessionStorage` com chave distinta da visao atual.
- A biblioteca de imagens anteriores pode ser derivada do proprio `scales` mock nesta fase.
- A visao admin usara prefixo de rota `/admin/*` para isolamento funcional.

## 12) Arquitetura sugerida

- Estruturar rotas admin sob `/admin`:
  - `/admin/login`
  - `/admin/grupos`
  - `/admin/configuracoes` (placeholder inicial)
- Introduzir variacao de menu por contexto de rota:
  - `MainBottomNav` atual para rotas de grupo.
  - `AdminMainBottomNav` para rotas `/admin/*` (exceto `/admin/login`).
- Extrair dados mock para arquivos dedicados:
  - `src/data/groups.js` (lista de grupos)
  - `src/data/scaleImageLibrary.js` (ou derivado de `scales.js`)
- No `ScaleFeed`, adicionar nova view `IMAGES_VIEW` e modelo:
  - `scale.imageAttachment` (objeto unico ou `null`)
  - `imageLibrary` (lista de imagens reutilizaveis)

## 13) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-02, T-03 |
| AC-03 | T-03 |
| AC-04 | T-04 |
| AC-05 | T-05 |
| AC-06 | T-06, T-07 |
| AC-07 | T-08 |
| AC-08 | T-08, T-10 |
| AC-09 | T-09, T-10 |
