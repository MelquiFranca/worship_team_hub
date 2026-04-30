# Plano Tecnico - correcao-indisponibilidade-por-categoria

## 1) Referência da Spec

- Feature: correcao-indisponibilidade-por-categoria
- Documento: `features/correcao-indisponibilidade-por-categoria/spec.md`
- Versão da spec: v1

## 2) Estratégia de Implementação

Aplicar correcoes pontuais em regras de indisponibilidade por categoria (backend + frontend) e impedir escrita de `unavailableDates` em fluxos novos, preservando comportamento legado apenas onde necessario para leitura.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidência |
| --- | --- | --- | --- | --- |
| T-01 | Ajustar `getUnavailableComponentsForDateByCategory` para nao usar fallback de `unavailableDates`. | AC-01 | Unitario | `tests/unit/componentAvailability.test.mjs` |
| T-02 | Ajustar `componentIsUnavailableOnDate` no formulario de escala para nao usar fallback legado por categoria. | AC-02 | Manual + unitario indireto | `src/components/organisms/ScaleRegistrationForm/ScaleRegistrationForm.jsx` |
| T-03 | Remover persistencia de `unavailableDates` no `POST /api/components`. | AC-03 | Integracao/revisao | `src/app/api/components/route.js` |
| T-04 | Ajustar `PATCH /api/components/me/unavailability` para nao gerar `unavailableDates`. | AC-04 | Integracao/revisao | `src/app/api/components/me/unavailability/route.js` |
| T-05 | Executar testes direcionados e registrar validacao. | AC-01, AC-02, AC-03, AC-04 | Unitario | `validation.md` |

## 4) Ordem de Execução

1. Atualizar regra de indisponibilidade por categoria no backend.
2. Atualizar regra no frontend de cadastro de escala.
3. Remover escrita de `unavailableDates` em criacao e patch de indisponibilidade.
4. Executar testes direcionados e registrar evidencias.

## 5) Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
| --- | --- | --- | --- |
| Regressao em fluxos legados que dependem de `unavailableDates` | Medio | Media | Manter campo de leitura serializado quando existente; limitar mudanca aos fluxos por categoria e escrita nova. |
| Falha de teste por cobertura insuficiente | Medio | Media | Adicionar/ajustar teste unitario de disponibilidade por categoria. |

## 6) Estratégia de Rollout

- Feature flag: Não
- Migração necessária: Não
- Plano de fallback: reverter alteracoes de regra em caso de bloqueios inesperados.
- Plano de rollback: rollback do commit da feature.

## 7) Critérios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidências registradas
- [ ] Sem regressões críticas

## 8) Registro de Decisões Técnicas

| Data | Decisão | Motivação | Impacto |
| --- | --- | --- | --- |
| 2026-04-29 | `unavailabilityByDate` como fonte exclusiva para bloqueio por categoria | Evitar indisponibilidade indevida em categorias nao selecionadas | Corrige bug de negocio sem exigir migracao imediata |
