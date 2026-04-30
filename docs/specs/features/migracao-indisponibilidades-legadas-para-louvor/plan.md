# Plano Tecnico - migracao-indisponibilidades-legadas-para-louvor

## 1) Referência da Spec

- Feature: migracao-indisponibilidades-legadas-para-louvor
- Documento: `features/migracao-indisponibilidades-legadas-para-louvor/spec.md`
- Versão da spec: v1

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidência |
| --- | --- | --- | --- | --- |
| T-01 | Forcar `categoryTagIds: ['louvor']` para todas as datas migradas em `normalizeUnavailabilityByDate`. | AC-01, AC-02, AC-03 | Revisao + dry-run | `scripts/migrations/migrate-default-category-louvor.cjs` |
