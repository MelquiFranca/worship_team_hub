# Estrutura de Specs

Este diretório centraliza o fluxo de desenvolvimento orientado por especificação.

## Estrutura

- `templates/spec-template.md`: template da spec funcional.
- `templates/implementation-plan-template.md`: template do plano técnico.
- `references/review-checklist.md`: checklist de validação final.
- `features/`: specs por funcionalidade.

## Fluxo recomendado

1. Copiar `templates/spec-template.md` para `features/<nome-da-feature>/spec.md`.
2. Preencher problema, escopo, não-escopo e critérios de aceite.
3. Copiar `templates/implementation-plan-template.md` para `features/<nome-da-feature>/plan.md`.
4. Quebrar execução em tarefas pequenas com estratégia de testes.
5. Implementar em incrementos e registrar evidências em `features/<nome-da-feature>/validation.md`.
6. Revisar com `references/review-checklist.md` antes de fechar.

## Convenção de pastas

Cada feature deve ter sua própria pasta:

`features/<nome-da-feature>/`

- `spec.md`
- `plan.md`
- `validation.md`

