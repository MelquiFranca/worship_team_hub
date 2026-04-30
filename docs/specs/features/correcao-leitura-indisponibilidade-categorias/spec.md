# Spec Funcional - correcao-leitura-indisponibilidade-categorias

## 1) Contexto

- Data: 2026-04-29
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Engenharia

## 2) Problema

A leitura de `unavailabilityByDate` esta descartando `categoryTagIds` quando `allowedCategoryTagIds` chega como lista vazia, resultando em listas vazias na tela de indisponibilidade e na visao agrupada do `group-app`.

## 3) Objetivo

Restabelecer a exibicao de indisponibilidades registradas, preservando validacao de categorias apenas quando houver lista de categorias permitidas nao vazia.

## 4) Escopo

- Ajustar normalizacao de `categoryTagIds` para tratar `allowedCategoryTagIds=[]` como sem restricao.
- Validar impacto na serializacao de indisponibilidades proprias e agrupadas.

## 5) Não-Escopo

- Mudancas de UX da tela.
- Migracao de dados.

## 6) Usuários e Cenários

- Usuário-alvo: `component-app` e `group-app`
- Cenários principais:
  - Componente visualiza suas indisponibilidades ja cadastradas.
  - Grupo visualiza indisponibilidades agrupadas da equipe.

## 7) Critérios de Aceite (testáveis)

| ID | Critério | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | `normalizeCategoryTagIdsInput` nao invalida IDs quando `allowedCategoryTagIds=[]`. | Teste unitario | Alta |
| AC-02 | Serializacao de `unavailabilityByDate` mantem registros validos quando nao ha filtro explicito de categorias. | Teste unitario indireto | Alta |

## 12) Rastreabilidade inicial

| Critério | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-02 |
