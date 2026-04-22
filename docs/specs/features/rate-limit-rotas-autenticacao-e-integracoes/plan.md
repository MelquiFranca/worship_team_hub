# Plano Tecnico - rate-limit-rotas-autenticacao-e-integracoes

## 1) Referencia da Spec

- Feature: rate-limit-rotas-autenticacao-e-integracoes
- Documento: `features/rate-limit-rotas-autenticacao-e-integracoes/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Introduzir uma camada reutilizavel de rate limit por janela fixa/deslizante com interface unica (`checkLimit`), desacoplada do storage. Aplicar essa camada primeiro nas rotas de auth e depois nas rotas de integracao, com contrato de erro padronizado e instrumentacao de logs/metricas por endpoint.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Definir modulo central de configuracao/politicas de limite por rota (chave, janela, limite, estrategia de falha). | AC-01, AC-02, AC-03, AC-05, AC-09 | Unitario | Testes de config e parser de env |
| T-02 | Definir contrato de resposta de erro `429` e helper de `Retry-After` para API routes. | AC-04 | Unitario | Testes de contrato e header |
| T-03 | Integrar rate limit em `POST /api/auth/login` e `POST /api/auth/refresh`. | AC-01, AC-02, AC-04 | Integracao | Suite API auth com cenarios acima/abaixo do limite |
| T-04 | Integrar rate limit em `GET /api/youtube/search` e `GET /api/youtube/preview`. | AC-03, AC-04 | Integracao | Suite API YouTube com burst |
| T-05 | Implementar chave composta de login (IP + identificador normalizado/hasheado). | AC-01 | Unitario + Integracao | Testes de derivacao de chave |
| T-06 | Implementar chave de refresh baseada em IP + token/session fingerprint hasheado. | AC-02 | Unitario + Integracao | Testes de derivacao de chave |
| T-07 | Implementar chave das rotas YouTube (IP/sessao) com fallback robusto. | AC-03 | Unitario + Integracao | Testes de fallback de chave |
| T-08 | Instrumentar logs estruturados e contadores de allowed/blocked por endpoint. | AC-06, AC-07 | Unitario + Manual | Captura de logs e dump de metricas |
| T-09 | Expor variaveis de ambiente no `.env.example` e validar defaults seguros. | AC-05 | Manual + Unitario | Diff de config + testes de bootstrap |
| T-10 | Executar benchmark local comparativo para medir overhead p95 antes/depois. | AC-08 | Performance manual | Relatorio de benchmark |
| T-11 | Testar indisponibilidade do store e validar politica fail-safe por tipo de rota. | AC-09 | Integracao + Chaos/manual | Logs de falha + asserts de comportamento |
| T-12 | Consolidar `validation.md` e `evidence.md` com rastreabilidade final. | AC-01 a AC-09 | Manual | Documentacao atualizada |

## 4) Ordem de Execucao

1. Contratos e configuracao base (T-01, T-02).
2. Integracao nas rotas de autenticacao (T-03, T-05, T-06).
3. Integracao nas rotas de integracao externa (T-04, T-07).
4. Observabilidade e configuracao operacional (T-08, T-09).
5. Performance e resiliencia (T-10, T-11).
6. Consolidacao de validacao (T-12).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Limite agressivo bloqueando usuario legitimo | Alto | Media | Definir valores por rota com base em baseline real + monitoramento de falso positivo. |
| Implementacao in-memory inconsistente em multi-instancia | Medio | Alta | Isolar interface de store e planejar migracao para Redis antes de escala horizontal. |
| Vazamento de identificador sensivel no log da chave | Alto | Media | Hash de chave e proibicao de registrar payload bruto. |
| Falha do store derrubando fluxo de login | Alto | Baixa | Politica fail-safe explicita e testes de falha injetada. |
| Overhead elevado no request path | Medio | Baixa | Medir p95 e otimizar derivacao/chamadas em memoria. |

## 6) Estrategia de Rollout

- Feature flag: Sim (`RATE_LIMIT_ENABLED`, com subflags por dominio).
- Migracao necessaria: Nao para MVP (store in-memory); sim em fase evolutiva para Redis.
- Plano de fallback: desabilitar temporariamente apenas limite de integracao ou auth via env flag, mantendo logs de incidente.
- Plano de rollback: reverter middleware/helpers de rate limit e restaurar comportamento anterior das rotas.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-21 | Adotar modulo unico de rate limit com politicas por rota | Evitar duplicacao e divergencia entre endpoints | Facilita manutencao e auditoria |
| 2026-04-21 | Chave de login inclui identificador normalizado e IP | Melhorar defesa contra brute-force distribuido por conta | Exige hash para nao expor dado sensivel |
| 2026-04-21 | Politica fail-safe diferenciada entre auth e integracao | Priorizar seguranca em auth e continuidade controlada em integracao | Comportamento operacional mais previsivel |
