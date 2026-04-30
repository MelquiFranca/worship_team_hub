# Plano Tecnico - categorias-tags-escalas-componentes

## 1) Referencia da Spec

- Feature: categorias-tags-escalas-componentes
- Documento: `features/categorias-tags-escalas-componentes/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Aplicar a feature por camadas: (1) normalizacao/validacao compartilhada, (2) persistencia e regras de negocio em APIs, (3) ajuste de formulários/listagens no frontend, (4) validacao automatizada e manual com registro de evidencias.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Criar utilitarios de categorias e evoluir modelo de indisponibilidade para suportar `unavailabilityByDate`. | AC-01, AC-08 | Unitario indireto + lint | Codigo em `src/lib` |
| T-02 | Evoluir `group-settings` para `categoryTags` com defaults e bloqueio de exclusao em uso. | AC-01, AC-02, AC-09 | Integracao API + manual | Rotas atualizadas + `validation.md` |
| T-03 | Evoluir APIs de componentes para `categoryTagIds` obrigatorio, autorizacao `group-app` e backfill legado. | AC-03, AC-04, AC-09 | Integracao API | Rotas atualizadas + `validation.md` |
| T-04 | Evoluir APIs de escalas para `categoryTagId` unico, consistencia com componentes e indisponibilidade por categoria. | AC-05, AC-09 | Integracao API | Rotas atualizadas + `validation.md` |
| T-05 | Atualizar telas de componentes/escalas/configuracoes para CRUD/selecao/filtro por labels clicaveis, toggle unico de categoria em escala e distincao visual por categoria. | AC-06, AC-07 | Manual + lint | Componentes React/CSS |
| T-06 | Atualizar tela de indisponibilidade para `unavailabilityByDate` com multiplas tags por data. | AC-08, AC-09 | Manual + integracao API | Formulario atualizado |
| T-07 | Atualizar indices Mongo para consultas por categoria em componentes/escalas. | AC-06 | Revisao tecnica | `src/lib/db/mongodb.js` |

## 4) Ordem de Execucao

1. Implementar base de utilitarios e regras compartilhadas de categoria/indisponibilidade.
2. Atualizar backend de grupo e componentes.
3. Atualizar backend de escalas e filtros de visibilidade.
4. Atualizar frontend (configuracoes, componentes, escalas, indisponibilidade).
5. Rodar lint/testes e consolidar validacao.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Regressao em dados legados sem tags | Alto | Media | Backfill opportunistico em leitura + defaults consistentes por grupo |
| Inconsistencia de categoria entre escala e componente | Alto | Media | Validacao estrita no backend e filtro no frontend |
| Bloqueio indevido por permissao de tag | Medio | Media | Regra explicita por audiencia e mensagens claras de erro |
| Estado de UI confuso na indisponibilidade por categoria | Medio | Media | Exibir checkboxes por data e validacao antes de salvar |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Sim (backfill opportunistico em leitura)
- Plano de fallback: manter defaults (`louvor`) e ignorar filtros de categoria em caso de falha de parse.
- Plano de rollback: reverter alteracoes de rotas/UI e remover uso de novos campos.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes/lint executados
- [x] Evidencias registradas
- [x] Sem regressões criticas detectadas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-29 | Escala usa `categoryTagId` unico (nao lista) | Regra de negocio confirmada | Simplifica validacao e filtro |
| 2026-04-29 | Indisponibilidade por `unavailabilityByDate[{date, categoryTagIds[]}]` | Suportar multiplas categorias por dia | Mantem flexibilidade de agenda |
| 2026-04-29 | Exclusao de tag em uso e bloqueada no backend | Evitar perda de referencia | Garante integridade de dados |
| 2026-04-29 | Escalas visiveis sem bloqueio por tag; filtro visual por labels inicia nas tags do usuario | Ajuste de UX solicitado | Mantem descoberta completa sem perder foco por categoria |
