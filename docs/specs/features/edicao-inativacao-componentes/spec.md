# Spec Funcional - edicao-inativacao-componentes

## 1) Contexto

- Data: 2026-04-15
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Frontend, Backend, QA

## 2) Problema

A tela de componentes permite visualizar cards, mas nao define de forma objetiva quem pode clicar para editar, nem o fluxo completo para inativacao. Sem esse comportamento padronizado, usuarios sem permissao tentam interagir com acao bloqueada, e o ciclo de manutencao de componentes (editar/inativar) fica inconsistente entre UI e regras de acesso.

## 3) Objetivo

Definir e implementar fluxo unico para edicao e inativacao de componentes, onde apenas usuarios com permissao `group-app` podem acessar edicao pelo card, com suporte a salvamento de alteracoes, inativacao controlada e apresentacao clara de estado inativo nas listagens.

## 4) Escopo

- Tornar card de componente clicavel apenas para sessao com permissao `group-app`.
- Redirecionar clique autorizado para formulario de componentes em modo edicao.
- Habilitar no formulario as acoes de salvar edicao e inativar componente.
- Definir UX de bloqueio para permissoes nao autorizadas (`component-app`, `admin-panel` quando nao aplicavel e demais).
- Definir comportamento de componentes inativos na listagem, incluindo filtro e estado visual.

## 5) Nao-Escopo

- Reativacao de componente inativo nesta entrega.
- Alteracao do modelo de autenticacao/sessao existente.
- Mudanca de permissoes fora do contexto da tela de componentes.
- Reformulacao visual ampla da pagina alem dos ajustes necessarios ao fluxo.

## 6) Usuarios e Cenarios

- Usuario-alvo:
  - `group-app`
  - `component-app`
- Cenarios principais:
  - Usuario `group-app` clica em card de componente e acessa formulario em modo edicao.
  - Usuario `group-app` salva edicao com sucesso e retorna para listagem atualizada.
  - Usuario `group-app` inativa componente no formulario e item passa a refletir estado inativo.
  - Usuario sem permissao de edicao visualiza card sem acao de clique e recebe UX de bloqueio consistente.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Cards de componentes ficam clicaveis somente para usuario autenticado com permissao `group-app`. | Teste manual por perfil de permissao + teste de componente verificando estado habilitado/desabilitado do card. | Alta |
| AC-02 | Clique em card autorizado redireciona para rota de formulario de componentes em modo edicao com dados do componente carregados. | Teste de integracao frontend com mock de roteamento e carregamento por id. | Alta |
| AC-03 | Formulario em modo edicao permite salvar alteracoes validas e apresenta confirmacao de sucesso sem criar novo componente. | Teste de integracao frontend + teste de API de update (PUT/PATCH). | Alta |
| AC-04 | Formulario em modo edicao permite inativar componente ativo, com confirmacao explicita e persistencia de status inativo no backend. | Teste manual guiado + teste de integracao backend para mudanca de status. | Alta |
| AC-05 | Usuario sem permissao de edicao (`component-app` e demais nao autorizados) nao consegue editar por clique no card e recebe indicacao visual de bloqueio. | Teste manual por perfil + teste de renderizacao de estado bloqueado. | Alta |
| AC-06 | Listagem de componentes passa a exibir estado visual de item inativo e permite filtrar ativos/inativos/todos sem inconsistencias. | Teste manual de filtros + teste de integracao frontend da lista. | Media |

## 8) Requisitos Nao Funcionais

- Performance: nao adicionar mais de 200ms no tempo medio de abertura do formulario de edicao em ambiente local.
- Seguranca: validacao de permissao de edicao deve ocorrer no frontend (UX) e backend (autorizacao de update/inativacao).
- Acessibilidade: cards bloqueados devem manter semantica de elemento nao acionavel e feedback textual para leitores de tela.
- Observabilidade: registrar eventos de tentativa negada, edicao concluida e inativacao concluida com id do componente e perfil da sessao.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Usuario sem permissao tenta abrir rota de edicao diretamente por URL | Sistema bloqueia acesso, retorna estado de nao autorizado e orienta retorno para listagem. |
| ER-02 | Falha ao carregar dados do componente no modo edicao | Exibir mensagem de erro amigavel e opcao de tentar novamente sem quebrar navegacao. |
| ER-03 | Falha ao salvar edicao por erro de validacao | Exibir erros por campo e manter dados digitados no formulario. |
| ER-04 | Falha na inativacao por indisponibilidade do backend | Exibir erro transitorio, manter componente ativo e permitir nova tentativa. |
| ER-05 | Filtro de inativos sem resultados | Exibir estado vazio explicativo sem erro de interface. |

## 10) Dependencias e Restricoes

- Dependencias:
  - Tela/listagem de componentes ja existente.
  - Formulario de componentes reutilizavel para modo cadastro e modo edicao.
  - Endpoint backend para atualizar componente e registrar status ativo/inativo.
- Restricoes:
  - Manter compatibilidade com permissoes atuais da sessao.
  - Evitar quebra no fluxo de cadastro ja existente.

## 11) Suposicoes

- O perfil `group-app` e o unico com permissao de edicao/inativacao nesta tarefa.
- O status de atividade do componente sera representado por campo booleano (`active`) ou equivalente ja existente.
- A listagem atual suporta extensao para filtro sem necessidade de nova pagina.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-02, T-03 |
| AC-03 | T-03, T-04 |
| AC-04 | T-04, T-05 |
| AC-05 | T-01, T-06 |
| AC-06 | T-05, T-06, T-07 |
