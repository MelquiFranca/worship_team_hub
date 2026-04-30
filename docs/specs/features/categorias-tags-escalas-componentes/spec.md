# Spec Funcional - categorias-tags-escalas-componentes

## 1) Contexto

- Data: 2026-04-29
- Autor(a): Codex (GPT-5)
- Status: Implemented
- Stakeholders: Produto, Frontend, Backend, Lideranca de Louvor e Midia

## 2) Problema

A aplicacao nao diferencia categorias operacionais (ex.: Louvor e Midia) em componentes, escalas e indisponibilidades. Isso causa mistura de contextos e dificulta enxergar somente escalas relevantes para cada usuario.

## 3) Objetivo

Implementar categorizacao por tags no grupo, garantindo segmentacao coerente em componentes, escalas e indisponibilidades, com controle de visibilidade por usuario autenticado.

## 4) Escopo

- Configurar tags de categoria no grupo com defaults `Louvor` e `Midia`.
- Exigir que cada componente tenha ao menos uma tag de categoria.
- Exigir que cada escala tenha exatamente uma tag de categoria.
- Exibir todas as escalas e aplicar filtro por tags selecionaveis; por padrao usar intersecao com tags do usuario logado.
- Aplicar distincao visual de cor por categoria na tela de escalas.
- Permitir indisponibilidade por data com multiplas tags de categoria.
- Restringir edicao de `categoryTagIds` de componentes para audiencia `group-app`.
- Bloquear exclusao de tag em uso (componentes, escalas, indisponibilidades).

## 5) Nao-Escopo

- Alteracao de papeis/audiencias do sistema de autenticacao.
- Mudanca do fluxo de notificacao push e comentarios da escala.
- Reestruturacao de layout global fora das telas impactadas.

## 6) Usuarios e Cenarios

- Usuario-alvo: `group-app` (gestao), `component-app` (consulta/operacao), `admin-panel` (suporte tecnico).
- Cenarios principais:
  - `group-app` gerencia tags de categoria no grupo.
  - `group-app` cadastra componente com uma ou mais tags.
  - `group-app` cadastra escala com uma unica tag e somente componentes dessa tag.
  - Usuario autenticado visualiza apenas escalas relacionadas as suas tags.
  - Usuario registra indisponibilidade por data e por categoria.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | `group_settings` expoe/persiste `categoryTags` com defaults `louvor` e `midia`. | Teste de API (`GET/PATCH /api/group-settings`) + revisao de codigo | Alta |
| AC-02 | Exclusao de tag em uso e bloqueada no `PATCH /api/group-settings`. | Teste de API com tag referenciada em componentes/escalas/indisponibilidades | Alta |
| AC-03 | Componente nao salva sem `categoryTagIds` validos e respostas incluem `categoryTagIds`/`unavailabilityByDate`. | Teste de API (`POST/PATCH/GET /api/components`) | Alta |
| AC-04 | Somente `group-app` altera `categoryTagIds` de componentes. | Teste de autorizacao (`403` para outras audiencias) | Alta |
| AC-05 | Escala exige `categoryTagId` unico e rejeita componentes fora da categoria. | Teste de API (`POST/PATCH /api/scales`) | Alta |
| AC-06 | Tela de escalas permite ver todas as escalas, com filtro por tags (labels clicaveis) e estado inicial nas tags do usuario logado. | Teste manual/UI + revisao de logica de filtro no frontend | Alta |
| AC-07 | Tela de escalas evidencia categoria por cor/label no card. | Revisao visual/manual da UI | Media |
| AC-08 | Minha indisponibilidade aceita `unavailabilityByDate` com multiplas tags por data. | Teste de API e teste manual da tela | Alta |
| AC-09 | Backfill legado ocorre para componentes/escalas sem tags e indisponibilidade antiga. | Revisao de codigo + evidencia de migraçao opportunistica em leitura | Media |

## 8) Requisitos Nao Funcionais

- Performance: manter consultas indexadas por `groupId`, `categoryTagId` e `date` em escalas.
- Seguranca: manter controles de audiencia por rota e bloquear mutacoes nao autorizadas.
- Acessibilidade: novos controles de selecao com labels e estado legivel.
- Observabilidade: manter padrao de erros e mensagens da camada API existente.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Tag de categoria invalida em payload | `400 BAD_REQUEST` com mensagem clara |
| ER-02 | Tentativa de remover tag em uso | `400 BAD_REQUEST` com bloqueio explicito |
| ER-03 | Componente fora da tag da escala | `400 BAD_REQUEST` ao salvar escala |
| ER-04 | Usuario sem tag correspondente ao filtro padrao | Escalas continuam disponiveis ao desativar/ajustar filtros de tags |
| ER-05 | Usuario nao `group-app` tenta editar tags do componente | `403 FORBIDDEN` |

## 10) Dependencias e Restricoes

- Dependencias: colecoes Mongo `group_settings`, `components`, `scales`; contextos de sessao e configuracoes de grupo.
- Restricoes: manter compatibilidade com registros legados sem quebrar rotas existentes.

## 11) Suposicoes

- Cada escala pertence a exatamente uma tag de categoria.
- Visibilidade de escala para usuario logado usa regra de intersecao de tags.
- Usuario pode marcar indisponibilidade para multiplas categorias na mesma data.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-02 |
| AC-03 | T-03 |
| AC-04 | T-03 |
| AC-05 | T-04 |
| AC-06 | T-04 |
| AC-07 | T-05 |
| AC-08 | T-06 |
| AC-09 | T-02, T-03, T-04, T-06 |
