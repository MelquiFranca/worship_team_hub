# Evidencias - persistencia-refresh-sessions-mongodb

## Plano de evidencias esperadas

- Evidencia de modelagem/persistencia:
  - Colecao de refresh sessions no Mongo com campos e indices previstos.
  - Repositorio persistente substituindo store em memoria no fluxo de producao.
- Evidencia de seguranca:
  - Rotacao atomica funcionando com bloqueio de replay.
  - Revogacao efetiva em logout refletida entre instancias.
- Evidencia operacional:
  - Sessoes sobrevivem a restart de processo.
  - Logs estruturados para ciclo de vida de refresh session.

## Comandos e verificacoes planejadas

```bash
npm run lint
npm run test -- auth refresh
```

Validacoes manuais planejadas:

1. Login e confirmacao de documento de sessao no Mongo.
2. Refresh com token antigo apos rotacao deve falhar.
3. Logout seguido de refresh deve falhar.
4. Restart da app e novo refresh com sessao valida deve funcionar.

## Placeholders objetivos

- Evidencia AC-01:
  - Colecao/documento:
  - Teste relacionado:
  - Resultado:
- Evidencia AC-02:
  - Colecao/documento:
  - Teste relacionado:
  - Resultado:
- Evidencia AC-03:
  - Colecao/documento:
  - Teste relacionado:
  - Resultado:
- Evidencia AC-04:
  - Colecao/documento:
  - Teste relacionado:
  - Resultado:
- Evidencia AC-05:
  - Colecao/documento:
  - Teste relacionado:
  - Resultado:
- Evidencia AC-06:
  - Colecao/documento:
  - Teste relacionado:
  - Resultado:
