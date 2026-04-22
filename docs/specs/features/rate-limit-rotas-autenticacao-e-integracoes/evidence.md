# Evidencias - rate-limit-rotas-autenticacao-e-integracoes

## Registro de Execucao

- Data: 2026-04-21
- Status: Draft (pre-implementacao)

## Evidencias planejadas (futuras)

- Testes unitarios do modulo de politicas/configuracao de limite.
- Testes unitarios de derivacao de chave (login, refresh, YouTube).
- Testes de integracao para retorno `429` + `Retry-After` em todas as rotas alvo.
- Relatorio de benchmark local com comparativo p95 antes/depois.
- Evidencia de logs estruturados (`rate_limit_blocked`) sem dados sensiveis.
- Evidencia de metricas/counters por endpoint (allowed/blocked).
- Evidencia de teste de falha do storage com politica fail-safe aplicada.

## Checklist de artefatos

- [ ] `npm run lint` sem erros apos implementacao.
- [ ] Suite de testes de auth e integracoes atualizada e verde.
- [ ] Captura de resposta HTTP `429` com header `Retry-After`.
- [ ] Captura de log estruturado com campos minimos esperados.
- [ ] Captura de metricas de allowed/blocked por rota.
- [ ] Documento de configuracao (`.env.example`) atualizado com limites.
- [ ] `validation.md` atualizado com ACs em Pass/Fail final.

## Rastreabilidade rapida

- AC-01, AC-02, AC-03: testes de integracao das rotas alvo.
- AC-04: contrato de erro + header `Retry-After`.
- AC-05: configuracao/env + parser de defaults.
- AC-06, AC-07: logs e metricas.
- AC-08: benchmark de latencia p95.
- AC-09: teste de indisponibilidade do store.
