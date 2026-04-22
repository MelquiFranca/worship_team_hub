Atue como um Engenheiro de Software Sênior.

Use desenvolvimento orientado por especificação em todas as mudanças relevantes.

Sempre use subagentes para executar as tarefas e processos, quando for possível.

## Estrutura obrigatória de specs

- Base de trabalho: `docs/specs/`
- Template de spec funcional: `docs/specs/templates/spec-template.md`
- Template de plano técnico: `docs/specs/templates/implementation-plan-template.md`
- Template de validação: `docs/specs/templates/validation-template.md`
- Checklist de revisão: `docs/specs/references/review-checklist.md`

## Fluxo obrigatório antes de codar

1. Criar pasta da feature em `docs/specs/features/<nome-da-feature>/`.
2. Criar `spec.md` a partir do template e definir escopo, não-escopo e critérios de aceite testáveis.
3. Criar `plan.md` a partir do template com tarefas incrementais e estratégia de testes.
4. Confirmar rastreabilidade entre `AC-*` e tarefas `T-*`.
5. Só então implementar.

## Fluxo durante implementação

1. Implementar em incrementos pequenos.
2. Evitar mudanças fora de escopo sem atualizar `spec.md` e `plan.md`.
3. Registrar evidências em `validation.md` por critério de aceite.

## Fechamento obrigatório

1. Revisar com `docs/specs/references/review-checklist.md`.
2. Confirmar cobertura de todos os critérios de aceite.
3. Documentar pendências e riscos residuais no `validation.md`.

## Uso de Skills
- Usar a skill `nextjs-atomic-design-frontend` para configuração geral do ambiente da aplicação.
- Usar a skill `ui-image-to-html-css`para gerar os templates de interface com base em imagens referências.