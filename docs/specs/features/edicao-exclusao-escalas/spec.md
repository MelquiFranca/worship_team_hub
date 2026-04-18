# Spec Funcional - edicao-exclusao-escalas

## 1) Contexto

- Data: 2026-04-15
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Frontend, Backend, UX, QA
- Origem: Tarefa 2 do pacote de evolucao da experiencia de escalas

## 2) Problema

A tela de escalas possui acao de consulta e cadastro, mas ainda nao fecha o ciclo de manutencao do registro apos criado. Sem fluxo de edicao e exclusao no mesmo contexto da listagem, o usuario depende de caminhos incompletos, aumenta retrabalho e pode manter dados desatualizados.

## 3) Objetivo

Entregar fluxo completo de edicao e exclusao de escalas a partir do card da listagem, com redirecionamento para formulario em modo edicao, persistencia das alteracoes, exclusao com confirmacao e feedback claro ao usuario, respeitando permissao por audiencia (`group-app` autorizado e `component-app` sem permissao).

## 4) Escopo

- Adicionar acao de `Editar escala` no card da listagem com redirecionamento para formulario de escalas em modo edicao.
- Reaproveitar formulario de escalas para carregar dados existentes e permitir atualizacao dos campos.
- Disponibilizar acao de exclusao dentro do formulario em modo edicao.
- Exigir confirmacao explicita antes da exclusao definitiva.
- Atualizar listagem de escalas apos editar ou excluir, sem exibir registro obsoleto.
- Exibir feedback de sucesso/erro nas operacoes de edicao e exclusao.
- Aplicar regra de permissao por audiencia para visualizar e executar acoes.

## 5) Nao-Escopo

- Versionamento historico de escalas editadas.
- Exclusao em lote de multiplas escalas.
- Fluxo de restauracao (undo) apos exclusao concluida.
- Alteracao de regras de negocio de montagem da escala fora do formulario ja existente.

## 6) Usuarios e Cenarios

- Usuario-alvo:
  - `group-app` (lideranca autorizada para editar e excluir).
  - `component-app` (usuario com acesso de consulta, sem permissao para editar/excluir).
- Cenarios principais:
  - Usuario `group-app` clica em `Editar escala` no card e acessa formulario preenchido para ajuste.
  - Usuario `group-app` salva alteracoes e retorna para listagem com dados atualizados.
  - Usuario `group-app` inicia exclusao no formulario, confirma a acao e retorna para listagem sem o item removido.
  - Usuario `component-app` nao visualiza nem consegue executar acoes de edicao/exclusao.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | O botao `Editar escala` no card redireciona para o formulario de escalas em modo edicao com identificador da escala alvo. | Teste manual de navegacao + teste de integracao de rota. | Alta |
| AC-02 | O formulario em modo edicao carrega dados existentes da escala e permite alterar campos validos. | Teste de integracao de carregamento e submit. | Alta |
| AC-03 | Ao salvar a edicao com sucesso, usuario recebe feedback positivo e a listagem passa a exibir os dados atualizados. | Teste manual + integracao de refresh/listagem. | Alta |
| AC-04 | O formulario em modo edicao exibe acao de excluir escala somente para audiencia autorizada (`group-app`). | Teste de permissao por audiencia em UI. | Alta |
| AC-05 | Ao solicitar exclusao, sistema exige confirmacao explicita antes de remover definitivamente. | Teste manual do fluxo de confirmacao. | Alta |
| AC-06 | Apos exclusao confirmada com sucesso, usuario recebe feedback e a escala removida nao aparece mais na listagem. | Teste de integracao + validacao manual de estado final. | Alta |
| AC-07 | Usuario `component-app` nao possui acesso a editar/excluir escala (acao oculta/desabilitada e bloqueio server-side quando aplicavel). | Teste de UI + teste de autorizacao. | Alta |
| AC-08 | Em falha de salvar edicao ou excluir, sistema preserva contexto, nao perde dados indevidamente e apresenta mensagem de erro acionavel. | Teste de integracao com simulacao de erro backend. | Media |

## 8) Requisitos Nao Funcionais

- Performance: carregamento do formulario em modo edicao com dados iniciais em tempo compativel com fluxo atual da tela (sem travamento perceptivel).
- Seguranca: autorizacao baseada em audiencia do JWT; validacao de permissao tambem no backend para operacoes de update/delete.
- Acessibilidade: dialogo de confirmacao com foco gerenciado, rotulos claros e navegacao por teclado.
- Observabilidade: registrar eventos minimos de `scale_edit_opened`, `scale_edit_saved`, `scale_delete_requested`, `scale_delete_confirmed`, `scale_delete_failed`.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Escala nao encontrada ao abrir modo edicao | Exibir estado de erro com opcao de voltar para listagem. |
| ER-02 | Falha de rede ao salvar edicao | Manter formulario preenchido, exibir erro e permitir nova tentativa. |
| ER-03 | Falha de rede ao excluir apos confirmacao | Manter item na listagem, exibir erro e permitir tentar novamente. |
| ER-04 | Token com audiencia sem permissao tenta acessar rota de edicao por URL direta | Bloquear acesso com redirecionamento controlado ou `403`. |
| ER-05 | Usuario fecha confirmacao de exclusao sem confirmar | Nenhuma alteracao de dados; manter formulario em modo edicao. |

## 10) Dependencias e Restricoes

- Dependencias:
  - Fluxo de autenticacao JWT por audiencias ja definido.
  - Formulario de escalas existente (base da feature `cadastro-escalas`).
  - Listagem de escalas existente (cards e navegacao da feature `evolucao-tela-escalas`).
- Restricoes:
  - Manter consistencia visual e de navegacao ja adotada nas telas de escalas.
  - Nao quebrar permissoes ja estabelecidas na feature `regras-permissoes-app`.

## 11) Suposicoes

- Existe identificador estavel por escala para abrir modo edicao e executar update/delete.
- Camada de dados suporta operacoes de atualizar e remover escala.
- O formulario atual pode operar em dois modos: criacao e edicao.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-02, T-03 |
| AC-03 | T-03, T-06 |
| AC-04 | T-04 |
| AC-05 | T-05 |
| AC-06 | T-05, T-06 |
| AC-07 | T-04, T-07 |
| AC-08 | T-03, T-05, T-06 |
