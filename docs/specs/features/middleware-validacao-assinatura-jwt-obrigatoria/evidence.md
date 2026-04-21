# Evidencias - middleware-validacao-assinatura-jwt-obrigatoria

## Plano de evidencias esperadas

- Evidencia de codigo:
  - Remocao de qualquer bypass permissivo no middleware.
  - Validacao obrigatoria de assinatura e claims antes de liberar acesso.
- Evidencia de contrato:
  - `401` para token invalido/expirado/malformado.
  - `503 AUTH_CONFIG_MISSING` para ausencia de chave/segredo.
- Evidencia de testes:
  - Suite automatizada cobrindo cenarios de bypass historico.

## Comandos e verificacoes planejadas

```bash
npm run lint
npm run test -- middleware auth
```

Validacoes manuais planejadas:

1. Requisicao com token adulterado deve retornar `401`.
2. Requisicao sem chave configurada deve retornar `503`.
3. Requisicao com token valido assinado deve retornar sucesso na rota protegida.

## Placeholders objetivos

- Evidencia AC-01:
  - Caso de teste:
  - Resultado:
  - Arquivo/trecho:
- Evidencia AC-02:
  - Caso de teste:
  - Resultado:
  - Arquivo/trecho:
- Evidencia AC-03:
  - Caso de teste:
  - Resultado:
  - Arquivo/trecho:
- Evidencia AC-04:
  - Caso de teste:
  - Resultado:
  - Arquivo/trecho:
- Evidencia AC-05:
  - Caso de teste:
  - Resultado:
  - Arquivo/trecho:
