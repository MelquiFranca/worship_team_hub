# Evidencias - transacoes-mongodb-fluxos-multicolecao

## Plano de Evidencias

| Item | Evidencia esperada | Status |
| --- | --- | --- |
| Matriz de decisao | Documento com fluxos, risco e decisao (transacao vs compensacao) | Concluido |
| Fluxo prioritario adaptado | Diff de codigo com sessao/transacao no fluxo grupo/gestor/config | Concluido |
| Testes de abort/rollback | Relatorio de falhas induzidas sem estado parcial | Parcial |
| Contrato de erro | Captura de respostas e codigos padronizados em falhas transacionais | Concluido |
| Logs transacionais | Registros com inicio/commit/abort sem dados sensiveis | Concluido |
| Fallback operacional | Guia de acao para ambiente sem suporte/config transacional | Concluido |

## Observacoes

- Matriz de decisao registrada na secao 13 da spec.
- Fluxo de criacao admin usa `runMongoTransactionWithRetry` com logs `transaction_start`, `transaction_commit`, `transaction_abort`.
- Fallback operacional controlado por:
  - `MONGODB_MULTI_COLLECTION_TRANSACTIONS=enabled|disabled`
  - `MONGODB_MULTI_COLLECTION_TRANSACTIONS_FALLBACK=compensation|disabled`
- Testes executados:
  - `npm run test:unit` (incluindo `tests/unit/mongodb-transactions.test.mjs`)
  - `npm run test:integration`
- Lacuna atual: ainda nao ha teste de integracao dedicado ao endpoint `/api/admin/groups` com falha induzida entre colecoes.
