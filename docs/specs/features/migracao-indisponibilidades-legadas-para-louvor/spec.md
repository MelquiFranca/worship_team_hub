# Spec Funcional - migracao-indisponibilidades-legadas-para-louvor

## 1) Contexto

- Data: 2026-04-29
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Engenharia

## 2) Problema

A migracao atual preserva/mescla categorias existentes em `unavailabilityByDate`. Ha necessidade de padronizar todo legado vinculando indisponibilidades somente a `louvor`.

## 3) Objetivo

Garantir que toda indisponibilidade existente (de `unavailableDates` e `unavailabilityByDate`) seja migrada para `unavailabilityByDate` com `categoryTagIds: ['louvor']`.

## 4) Escopo

- Ajustar `scripts/migrations/migrate-default-category-louvor.cjs` para forcar `louvor` em todas as datas migradas.

## 7) Critérios de Aceite (testáveis)

| ID | Critério | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Datas vindas de `unavailableDates` migram para `unavailabilityByDate` com `['louvor']`. | Dry-run + revisao de codigo | Alta |
| AC-02 | Datas ja existentes em `unavailabilityByDate` tambem ficam com `['louvor']`. | Dry-run + revisao de codigo | Alta |
| AC-03 | `unavailableDates` legado e removido apos migracao. | Revisao de codigo | Alta |

## 12) Rastreabilidade inicial

| Critério | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-01 |
| AC-03 | T-01 |
