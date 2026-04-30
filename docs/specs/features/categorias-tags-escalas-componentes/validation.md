# Validacao - categorias-tags-escalas-componentes

## Evidências por Critério de Aceite

| Critério | Resultado (Pass/Fail) | Evidência | Observações |
| --- | --- | --- | --- |
| AC-01 | Pass | `src/app/api/group-settings/route.js`, `src/lib/categories/tags.js` | `categoryTags` com defaults `louvor`/`midia` e serializacao ativa. |
| AC-02 | Pass | `src/app/api/group-settings/route.js` | Bloqueio de exclusao de tag em uso por componentes/escalas/indisponibilidades. |
| AC-03 | Pass | `src/app/api/components/route.js`, `src/app/api/components/[componentId]/route.js` | `categoryTagIds` obrigatorio e payload/response com novos campos. |
| AC-04 | Pass | `src/app/api/components/route.js`, `src/app/api/components/[componentId]/route.js` | `403` quando audiencia diferente de `group-app` tenta alterar `categoryTagIds`. |
| AC-05 | Pass | `src/app/api/scales/route.js`, `src/app/api/scales/[scaleId]/route.js` | Escala exige `categoryTagId` e valida componentes aderentes a categoria. |
| AC-06 | Pass | `src/app/escalas/ScalesPageClient.jsx`, `src/components/organisms/ScaleFeed/ScaleFeed.jsx`, `src/components/organisms/ScaleFeed/ScaleFeed.module.css` | Filtro por labels clicaveis com estado inicial nas tags do usuario; usuario pode exibir todas as escalas ao ajustar filtros. |
| AC-07 | Pass | `src/components/organisms/ScaleFeed/ScaleFeed.jsx`, `src/components/organisms/ScaleFeed/ScaleFeed.module.css` | Badge e borda por categoria com cor configurada. |
| AC-08 | Pass | `src/app/api/components/me/unavailability/route.js`, `src/components/organisms/ComponentUnavailabilityForm/ComponentUnavailabilityForm.jsx` | `unavailabilityByDate` com multiplas tags por data no backend e UI. |
| AC-09 | Pass | `src/app/api/components/route.js`, `src/app/api/components/[componentId]/route.js`, `src/app/api/scales/route.js`, `src/app/api/scales/[scaleId]/route.js` | Backfill opportunistico em leitura para campos legados ausentes. |

## Resultado final

- Status: Parcial
- Data: 2026-04-29
- Responsável: Codex (GPT-5)

## Pendências e Riscos Residuais

- Validacao manual de ponta a ponta com massa real em ambiente de staging ainda pendente (incluindo fluxo completo por perfil).
- Testes automatizados atuais nao cobrem todos os novos cenarios de categoria; cobertura adicional de integracao/e2e e recomendada.
