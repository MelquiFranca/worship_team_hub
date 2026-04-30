# Plano Tecnico - correcao-leitura-indisponibilidade-categorias

## 1) Referência da Spec

- Feature: correcao-leitura-indisponibilidade-categorias
- Documento: `features/correcao-leitura-indisponibilidade-categorias/spec.md`
- Versão da spec: v1

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidência |
| --- | --- | --- | --- | --- |
| T-01 | Ajustar `normalizeCategoryTagIdsInput` para filtro opcional somente com lista nao vazia. | AC-01 | Unitario | `src/lib/categories/tags.js` |
| T-02 | Criar teste unitario cobrindo serializacao/normalizacao sem filtro explicito. | AC-02 | Unitario | `tests/unit/category-tags-normalization.test.mjs` |
