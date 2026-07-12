# Plano Técnico - filtro-categorias-componentes-design-cadastro

## 1) Referência da Spec

- Feature: filtro-categorias-componentes-design-cadastro
- Documento: `features/filtro-categorias-componentes-design-cadastro/plan.md`
- Versão da spec: v1

## 2) Estratégia de Implementação

Alterar o filtro de categorias da tela de listagem de componentes para usar o mesmo padrão visual de botões segmentados usado no cadastro de escalas e no filtro de escalas, substituindo o seletor `<select>` atual. A lógica permanece local ao organismo `ComponentsGallery`.

Escopo:
- Substituir o `<select>` de categorias em `ComponentsGallery`.
- Manter seleção única: uma opção ativa por vez.
- Incluir opção "Todas" no mesmo estilo dos botões.
- Preservar acessibilidade básica com grupo nomeado, `aria-pressed` e foco visível.
- Garantir layout responsivo sem overflow.

Não-escopo:
- Alterar cadastro/edição de componentes.
- Alterar API, cache ou persistência.
- Alterar os chips/sinais de categoria dentro dos cards de componentes.

Critérios de aceite:
- AC-01: A tela de listar componentes não usa mais `<select>` para filtrar categorias.
- AC-02: O filtro usa botões segmentados equivalentes ao padrão visual do filtro de escalas/cadastro de escalas.
- AC-03: Apenas uma categoria/opção fica ativa por vez; ao ativar uma, a anterior é desativada.
- AC-04: A opção "Todas" continua disponível e mostra todos os componentes.
- AC-05: O filtro mantém `aria-pressed`, foco visível e layout responsivo.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidência |
| --- | --- | --- | --- | --- |
| T-01 | Mapear filtro atual e CSS de `ComponentsGallery` | AC-01, AC-02 | Revisão estática | Concluído: `ComponentsGallery.jsx` e `.module.css` revisados |
| T-02 | Trocar `<select>` por grupo de botões de seleção única | AC-01, AC-03, AC-04 | Revisão estática | Concluído: `ComponentsGallery.jsx` renderiza botão "Todas" e um botão por categoria |
| T-03 | Aplicar CSS equivalente ao padrão de botões segmentados | AC-02, AC-05 | Revisão estática | Concluído: `ComponentsGallery.module.css` usa grid responsivo, botão 48px, gradiente ativo e foco visível |
| T-04 | Executar testes viáveis e revisar checklist | AC-01, AC-02, AC-03, AC-04, AC-05 | Unitário/estático | Concluído: `npm test -- --test-name-pattern=category` passou |
| T-05 | Desfazer estado multisseleção e restaurar seleção única com botão "Todas" | AC-03, AC-04 | Revisão estática/unitário | Concluído: `ComponentsGallery.jsx` voltou a usar `selectedCategoryTagId` com valor `all` |

## 4) Ordem de Execução

1. Criar spec/plano obrigatório.
2. Alterar JSX do filtro em `ComponentsGallery`.
3. Alterar CSS local de `ComponentsGallery`.
4. Executar testes.
5. Registrar evidências e riscos residuais.

## 5) Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
| --- | --- | --- | --- |
| Perder a opção "Todas" existente | Médio | Baixa | Renderizar botão explícito com valor `all` |
| Botões de categorias longas causarem overflow | Médio | Média | Usar grid responsivo e `overflow-wrap` |
| Afetar chips de categoria dos cards | Baixo | Baixa | Alterar somente classes do filtro, mantendo `.categoryTag` |

## 6) Estratégia de Rollout

- Feature flag: Não
- Migração necessária: Não
- Plano de fallback: restaurar `<select>` e estilos antigos em `ComponentsGallery`.
- Plano de rollback: reverter mudanças em `ComponentsGallery.jsx`, `ComponentsGallery.module.css` e este plano.

## 7) Critérios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidências registradas
- [x] Sem regressões críticas

## 8) Registro de Decisões Técnicas

| Data | Decisão | Motivação | Impacto |
| --- | --- | --- | --- |
| 2026-07-12 | Manter o filtro como seleção única com opção "Todas" | Comportamento atual do select já é seleção única e inclui visão geral | Mudança fica visual, com baixo impacto funcional |
| 2026-07-12 | Desfazer multisseleção solicitada depois | Pedido explícito para desfazer a última alteração | Filtro volta a ter seleção única e botão "Todas" |

## 9) Revisão Final

- Checklist usado: `docs/specs/references/review-checklist.md`
- Cobertura de AC: AC-01 coberto pela remoção do `<select>`; AC-02 coberto por classes de botões segmentados; AC-03 coberto pelo estado único `selectedCategoryTagId`; AC-04 coberto pelo botão `Todas`; AC-05 coberto por `role="group"`, `aria-pressed`, foco visível e grid responsivo.
- Pendências: Nenhuma bloqueante.
- Riscos residuais: Sem validação visual em navegador nesta rodada; risco baixo porque o CSS replica o padrão já aplicado no filtro de escalas.
- Evidência de testes: `npm test -- --test-name-pattern=category` em 2026-07-12, com 64 unitários, 8 integração e 4 smoke passando. Executado novamente após rollback pontual com o mesmo resultado.
