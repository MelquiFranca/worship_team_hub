# Plano Tecnico - persistencia-refresh-sessions-mongodb

## 1) Referencia da Spec

- Feature: persistencia-refresh-sessions-mongodb
- Documento: `features/persistencia-refresh-sessions-mongodb/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Introduzir repositorio MongoDB para refresh sessions e substituir gradualmente a store em memoria. O fluxo de login/refresh/logout passara a operar exclusivamente na persistencia duravel, com operacoes atomicas para evitar replay e inconsistencias entre instancias.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Definir schema logico da refresh session e criar indices obrigatorios na colecao Mongo. | AC-01, AC-05 | Integracao | Script/codigo de indices |
| T-02 | Implementar repositorio Mongo para criar/buscar/atualizar/revogar refresh sessions. | AC-01, AC-02, AC-04 | Unitario/Integracao | Testes de repositorio |
| T-03 | Adaptar endpoint de refresh para rotacao atomica e bloqueio de replay usando persistencia Mongo. | AC-02 | Integracao | Teste de replay |
| T-04 | Adaptar logout para revogacao persistente de sessao e invalidacao imediata. | AC-03 | Integracao | Teste pos-logout |
| T-05 | Remover dependencia da store em memoria no caminho de producao e ajustar injeção de dependencia. | AC-04, AC-06 | Integracao | Diff + testes de fluxo |
| T-06 | Validar estrategia de expiracao (TTL ou job) e comportamento de limpeza de sessoes expiradas. | AC-05 | Integracao/Manual | Evidencia de indices e expiracao |
| T-07 | Instrumentar logs e metricas basicas de ciclo de vida de refresh session. | AC-06 | Unitario/Manual | Captura de logs |

## 4) Ordem de Execucao

1. Estruturar dados e indices no Mongo (T-01).
2. Implementar repositorio persistente (T-02).
3. Migrar refresh/logout para operacoes atomicas persistentes (T-03, T-04).
4. Remover dependencia de memoria e finalizar observabilidade/expiracao (T-05, T-06, T-07).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Corrida de refresh gera dupla emissao valida | Alto | Media | Operacao atomica (findOneAndUpdate transacional quando necessario) + teste de concorrencia. |
| Falha de conectividade com Mongo derruba auth | Alto | Media | Tratamento de erro padronizado e monitoramento de disponibilidade. |
| Crescimento descontrolado da colecao de sessoes | Medio | Media | TTL/limpeza e revisao periodica de indices. |
| Regressao por coexistencia temporaria de store em memoria | Medio | Alta | Remocao explicita do caminho de memoria para producao e testes de regressao. |

## 6) Estrategia de Rollout

- Feature flag: Sim (ex.: `AUTH_REFRESH_STORE=mongodb` durante transicao)
- Migracao necessaria: Sim (colecao e indices de refresh sessions)
- Plano de fallback: em incidente, manter operacao controlada conforme politica definida para store alternativa temporaria.
- Plano de rollback: rollback de codigo e controle de flag, preservando integridade das sessoes ja revogadas.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressions criticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-21 | Refresh sessions passam a ser persistidas no MongoDB | Garantir consistencia entre instancias e sobrevivencia a restart | Habilita escalabilidade horizontal segura |
| 2026-04-21 | Rotacao de refresh token deve ser atomica | Evitar replay e corrida de concorrencia | Reduz risco de sequestro de sessao |
