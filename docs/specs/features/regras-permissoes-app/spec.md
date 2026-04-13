# Spec Funcional - regras-permissoes-app

## 1) Contexto

- Data: 2026-04-13
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Frontend, Backend, Segurança

## 2) Problema

Com a autenticação JWT já existente, ainda falta consolidar o comportamento funcional de permissões no app conforme a audiência do token. Sem esse fechamento, usuários de perfis diferentes podem visualizar ou executar ações incompatíveis com seu papel, e a experiência do componente não reflete claramente sua participação na escala.

## 3) Objetivo

Implementar autorização funcional completa por audiência (`admin-panel`, `group-app`, `component-app`) usando informações do JWT, garantindo que menu, telas, ações permitidas e bloqueadas respeitem as regras de negócio e que o componente logado seja destacado nas escalas em que participa.

## 4) Escopo

- Usar claims do JWT (`aud`, `role`, `sub`, `groupId`) como fonte de verdade para permissões de UI e ações.
- Garantir acesso público às telas:
  - `/login`
  - `/admin/login`
- `admin-panel`:
  - Acesso total às telas e funcionalidades da visão administrativa.
- `group-app`:
  - Acesso total às telas e funcionalidades da visão de grupo.
- `component-app`:
  - Menu principal disponível somente com: Escalas, Componentes e Avatar.
  - Acesso a Editar Perfil, com restrição para não alterar nome.
  - Permissão para enviar mensagens nas escalas.
  - Permissão para visualizar componentes das escalas.
  - Permissão para visualizar e executar músicas da playlist.
  - Permissão para visualizar imagem da escala.
  - Bloqueio para enviar notificação.
  - Bloqueio para editar escalas ou componentes.
  - Bloqueio para inserir escalas ou componentes.
- Destacar visualmente o usuário logado na lista de componentes nas escalas em que estiver inserido.

## 5) Não-Escopo

- Criação de novos papéis além de `admin`, `group_owner` e `component`.
- Mudança de design system completo das telas.
- Implementação de ACL granular por recurso além do escopo de audiência/papel definido.
- Fluxos de delegação temporária de permissão.

## 6) Usuários e Cenários

- Usuário-alvo:
  - Administrador
  - Líder de grupo (`group_owner`)
  - Componente (`component`)
- Cenários principais:
  - Admin autenticado acessa integralmente o painel administrativo.
  - Líder de grupo autenticado acessa integralmente rotas e ações da visão de grupo.
  - Componente autenticado vê menu reduzido e executa apenas ações permitidas.
  - Componente visualiza escala em que participa e sua linha aparece destacada.
  - Componente tenta ação proibida (notificar, editar/inserir escala/componente) e recebe bloqueio consistente.

## 7) Critérios de Aceite (testáveis)

Use formato passa/falha.

| ID | Critério | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Claims do JWT (`aud`, `role`, `sub`, `groupId`) são consumidas como base para resolver permissões no client e middleware, sem depender de flags mock em `sessionStorage`. | Teste de integração + inspeção de fluxo autenticado. | Alta |
| AC-02 | `/login` e `/admin/login` permanecem acessíveis sem autenticação para qualquer usuário. | Teste manual e de integração de rotas públicas. | Alta |
| AC-03 | Usuário `admin-panel` possui acesso total à visão Admin (rotas e ações administrativas). | Teste de integração com token admin e navegação completa de admin. | Alta |
| AC-04 | Usuário `group-app` possui acesso total à visão do Grupo (rotas e ações do grupo). | Teste de integração com token group_owner. | Alta |
| AC-05 | Usuário `component-app` visualiza no menu principal apenas: Escalas, Componentes e Avatar. | Teste de UI (manual + snapshot). | Alta |
| AC-06 | Usuário `component-app` acessa Editar Perfil, porém o campo de nome não pode ser alterado (readonly/disabled e bloqueio no submit). | Teste de UI e teste de integração de formulário. | Alta |
| AC-07 | Usuário `component-app` pode enviar mensagens em escalas e visualizar componentes, playlist e imagem da escala. | Teste de integração de ações em `ScaleFeed`. | Alta |
| AC-08 | Usuário `component-app` não pode enviar notificação, editar escala/componente ou inserir escala/componente (ações ocultas ou desabilitadas + bloqueio no backend quando aplicável). | Teste de UI + integração de autorização de ações. | Alta |
| AC-09 | Nas escalas em que o usuário logado estiver presente, sua exibição é destacada visualmente na lista de componentes. | Teste de UI com usuário componente presente/ausente na escala. | Alta |
| AC-10 | Tentativas de acesso/ação não autorizadas retornam comportamento consistente (`403` ou redirecionamento controlado) sem vazar detalhes sensíveis. | Teste de integração de erros e fluxos proibidos. | Média |

## 8) Requisitos Não Funcionais

- Performance: resolução de permissão no client/middleware sem impacto perceptível no carregamento das telas (p95 local <= 50ms para checagem de autorização por rota).
- Segurança:
  - Permissões derivadas de JWT válido.
  - Ações críticas também protegidas no servidor, não apenas na UI.
  - Respostas de erro sem exposição de dados sensíveis.
- Acessibilidade:
  - Estados desabilitado/readonly semanticamente corretos (`disabled`, `aria-disabled`, `aria-readonly` quando aplicável).
  - Feedback de ação negada compreensível para leitor de tela.
- Observabilidade:
  - Eventos mínimos para acesso negado e tentativa de ação proibida (`access_denied`, `action_forbidden`).

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condição | Resposta esperada |
| --- | --- | --- |
| ER-01 | Usuário sem token tenta rota protegida | Redirecionar para `/login` ou `/admin/login` conforme área. |
| ER-02 | JWT com audiência incompatível para a rota | Bloquear com redirecionamento controlado ou `403`, conforme padrão da app. |
| ER-03 | Usuário `component-app` tenta acionar envio de notificação | Ação indisponível na UI e endpoint bloqueia com `403` se chamado diretamente. |
| ER-04 | Usuário `component-app` tenta editar/inserir escala ou componente | Ação indisponível na UI e endpoint bloqueia com `403` se chamado diretamente. |
| ER-05 | Usuário `component-app` tenta alterar nome em Editar Perfil | Campo de nome não editável; submit ignora/nega alteração do nome. |
| ER-06 | Falta de mapeamento do usuário logado para componente da escala | Não destacar nenhum item e manter renderização sem quebra. |

## 10) Dependências e Restrições

- Dependências:
  - Base JWT já implementada (`/api/auth/*`, middleware, cookies HttpOnly).
  - Mapeamento de identidade do usuário logado (`sub`) com componente da escala.
  - Componentes de UI: `MainBottomNav`, `ScaleFeed`, `Edit Profile`.
- Restrições:
  - Compatibilidade com estrutura atual de rotas e navegação.
  - Mudança incremental para evitar regressão de fluxo admin/grupo já funcional.

## 11) Suposições

- O JWT de `component-app` contém `sub` compatível com o usuário/componente exibido nas escalas.
- Existe endpoint/meio para obter sessão atual e claims no frontend.
- O comportamento de bloqueio de ações proibidas seguirá padrão já adotado (desabilitar/ocultar + validação server-side).

## 12) Rastreabilidade inicial

Mapeie cada critério de aceite para tarefas no plano técnico.

| Critério | Tarefa(s) do plano |
| --- | --- |
| AC-01, AC-02 | T-01, T-02 |
| AC-03, AC-04 | T-03, T-04 |
| AC-05, AC-06 | T-05, T-06 |
| AC-07, AC-08 | T-07, T-08, T-09 |
| AC-09 | T-10 |
| AC-10 | T-02, T-09, T-11 |
