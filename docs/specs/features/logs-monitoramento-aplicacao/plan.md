# Plano Tecnico - logs-monitoramento-aplicacao

## 1) Referencia da Spec

- Feature: logs-monitoramento-aplicacao
- Documento: `features/logs-monitoramento-aplicacao/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Criar um logger estruturado central com contrato estavel de campos, integrar gradualmente nas rotas criticas e consolidar regras de sanitizacao para evitar vazamento de dados sensiveis. A entrega sera incremental, validando primeiro contrato e seguranca do logger e depois cobertura funcional por dominios de rota.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Definir contrato do log estruturado (campos obrigatorios, severidade, eventos padrao) em modulo central. | AC-01, AC-05 | Unitario | Testes do contrato + exemplos de payload |
| T-02 | Implementar utilitarios de correlacao e sanitizacao (`requestId`, redacao de segredo/token/senha). | AC-01, AC-03, AC-06 | Unitario | Testes de sanitizacao/correlacao |
| T-03 | Instrumentar eventos de request de sucesso/falha nas rotas de autenticacao. | AC-02 | Integracao | Logs capturados em testes de API auth |
| T-04 | Instrumentar eventos de request de sucesso/falha nas rotas de escalas e componentes. | AC-02, AC-04 | Integracao | Logs capturados em testes de API dominio |
| T-05 | Instrumentar tratamento de excecoes nao tratadas com evento `request_failed` padronizado. | AC-03 | Integracao | Cenario com erro injetado + log resultante |
| T-06 | Incluir eventos de negocio relevantes (`login_failed`, `scale_updated`, `component_changed`) com metadados tecnicos minimos. | AC-04 | Integracao + Manual | Evidencia de eventos por fluxo |
| T-07 | Revisar classificacao de severidade em todos os eventos implementados. | AC-05 | Unitario + Revisao tecnica | Matriz evento x severidade |
| T-08 | Garantir fallback de `requestId` quando ausente no request de entrada. | AC-06 | Unitario + Integracao | Teste sem header de correlacao |
| T-09 | Atualizar documentacao operacional da feature (spec/plan/validation e checklist). | AC-07 | Manual | Documentos revisados e consistentes |

## 4) Ordem de Execucao

1. Contrato e seguranca do logger (T-01, T-02).
2. Cobertura inicial de requests em autenticacao (T-03).
3. Cobertura de requests e eventos de negocio em escalas/componentes (T-04, T-06).
4. Robustez de erro e correlacao (T-05, T-08).
5. Consistencia final e documentacao (T-07, T-09).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Vazamento de dado sensivel em log | Alto | Media | Sanitizacao central obrigatoria + testes dedicados de redacao. |
| Excesso de volume de log degradando leitura operacional | Medio | Media | Definir eventos obrigatorios por prioridade e niveis de severidade. |
| Inconsistencia de formato entre rotas | Medio | Media | Uso de helper unico com contrato validado por teste unitario. |
| Overhead de logging impactar latencia | Medio | Baixa | Medir `durationMs` e limitar campos a contexto essencial. |

## 6) Estrategia de Rollout

- Feature flag: Sim (`MONITORING_LOGS_ENABLED`).
- Migracao necessaria: Nao.
- Plano de fallback: desativar logs de monitoramento via flag mantendo logs tecnicos minimos existentes.
- Plano de rollback: reverter integracao das rotas para o comportamento anterior sem logger central.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressoes criticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-24 | Centralizar logger estruturado em modulo unico | Evitar divergencia de formato e facilitar manutencao | Padrao unico para todas as rotas alvo |
| 2026-04-24 | Tornar sanitizacao obrigatoria antes da emissao de logs | Reduzir risco de vazamento de segredo/PII | Maior seguranca operacional e compliance |
| 2026-04-24 | Adotar `requestId` obrigatorio com fallback automatico | Melhorar correlacao em incidentes sem depender de cliente | Triagem mais rapida em suporte e SRE |
