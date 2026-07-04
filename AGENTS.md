Atue como um Engenheiro de Software Sênior.

Use desenvolvimento orientado por especificação em todas as mudanças relevantes.

Sempre use subagentes para executar as tarefas e processos, quando for possível.

## Estrutura obrigatória de specs

- Base de trabalho: `docs/specs/`
- Arquivo único obrigatório por tarefa: `docs/specs/features/<nome-da-feature>/plan.md`
- Template obrigatório: `docs/specs/templates/implementation-plan-template.md`
- Checklist de revisão: `docs/specs/references/review-checklist.md`

## Fluxo obrigatório antes de codar

1. Criar pasta da feature em `docs/specs/features/<nome-da-feature>/`.
2. Criar `plan.md` a partir do template obrigatório.
3. Registrar no `plan.md` o escopo, não-escopo, critérios de aceite testáveis, tarefas incrementais e estratégia de testes.
4. Confirmar no `plan.md` a rastreabilidade entre `AC-*` e tarefas `T-*`.
5. Só então implementar.

## Fluxo durante implementação

1. Implementar em incrementos pequenos.
2. Evitar mudanças fora de escopo sem atualizar `plan.md`.
3. Registrar no `plan.md` as evidências por critério de aceite.

## Fechamento obrigatório

1. Revisar com `docs/specs/references/review-checklist.md`.
2. Confirmar cobertura de todos os critérios de aceite.
3. Documentar pendências e riscos residuais no `plan.md`.

## Uso de Skills
- Usar a skill `nextjs-atomic-design-frontend` para configuração geral do ambiente da aplicação.
- Usar a skill `ui-image-to-html-css`para gerar os templates de interface com base em imagens referências.
