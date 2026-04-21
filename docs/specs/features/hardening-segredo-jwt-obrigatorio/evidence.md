# Evidencias - hardening-segredo-jwt-obrigatorio

## Evidencias coletadas (pos-implementacao)

### AC-01 - Sem fallback hardcoded de segredo JWT

- Resultado: Pass
- Evidencia tecnica:
  - `src/lib/auth/service.js`: segredo resolvido por `AUTH_JWT_SECRET`/`JWT_SECRET` sem valor default em codigo.
  - `src/lib/auth/jwt.js`: `signJwt`/`verifyJwt` exigem segredo nao vazio e lancam `AUTH_CONFIG_MISSING` em ausencia.
  - `src/middleware.js`: removido fallback `'escalas-app-development-jwt-secret'`; validacao de assinatura falha quando segredo/chave nao configurados.

### AC-02 - Fail-fast sem segredo JWT

- Resultado: Pass
- Evidencia tecnica:
  - `assertJwtSecretConfigured` em `src/lib/auth/service.js` trata valor vazio/whitespace como ausente e lanca erro explicito `AUTH_CONFIG_MISSING` com status `503`.
  - Validacoes dirigidas:
    - `env -u AUTH_JWT_SECRET -u JWT_SECRET node --input-type=module -e "...assertJwtSecretConfigured()..."`
    - `AUTH_JWT_SECRET='   ' JWT_SECRET='   ' node --input-type=module -e "...assertJwtSecretConfigured()..."`
  - Resultado observado nas duas execucoes: `AUTH_CONFIG_MISSING 503`.

### AC-03 - Contrato `503 AUTH_CONFIG_MISSING` em login/refresh

- Resultado: Pass
- Evidencia tecnica:
  - `src/app/api/auth/login/route.js`: chamada de `assertJwtSecretConfigured` + tratamento de `isAuthConfigMissingError` com resposta padronizada.
  - `src/app/api/auth/refresh/route.js`: mesmo padrao para refresh.

### AC-04 - Documentacao de variaveis JWT obrigatorias

- Resultado: Pass
- Evidencia tecnica:
  - `.env.example`: bloco de JWT obrigatorio com `JWT_SECRET` e `AUTH_JWT_SECRET`.
  - `README.md`: instrucoes para configurar `JWT_SECRET` ou `AUTH_JWT_SECRET` com segredo forte e sem fallback em producao.

### AC-05 - Log estruturado de misconfiguracao sem vazar segredo

- Resultado: Pass
- Evidencia tecnica:
  - `src/lib/auth/errors.js`: `logAuthTechnicalEvent` gera evento estruturado.
  - `src/app/api/auth/login/route.js` e `src/app/api/auth/refresh/route.js`: evento `auth_config_invalid` com `route`, `method`, `requestId`, `status`, `code`, `missing`.
  - Sem inclusao de segredo/chave no payload de log.

## Comandos executados

1. `npm run lint`
2. `rg -n "JWT_SECRET|AUTH_JWT_SECRET|escalas-app-development-jwt-secret|auth_config_invalid|AUTH_CONFIG_MISSING" src`
3. `env -u AUTH_JWT_SECRET -u JWT_SECRET node --input-type=module -e "...assertJwtSecretConfigured()..."`
4. `AUTH_JWT_SECRET='   ' JWT_SECRET='   ' node --input-type=module -e "...assertJwtSecretConfigured()..."`
5. `AUTH_JWT_SECRET='valid-secret' node --input-type=module -e "...assertJwtSecretConfigured()..."`
