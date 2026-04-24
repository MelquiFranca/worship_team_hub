# Validacao - auth-nao-mascarar-indisponibilidade-mongo

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | `src/lib/auth/userSource.js`, `tests/unit/auth-user-source.test.mjs` | `loadAuthUsers` deixa de retornar `[]` silenciosamente em falha de dependencia. |
| AC-02 | Pass | `tests/unit/auth-user-source.test.mjs` | Erro validado com `AUTH_DEPENDENCY_UNAVAILABLE` e status `503`. |
| AC-03 | Pass | `src/app/api/auth/login/route.js`, `src/app/api/auth/refresh/route.js`, `src/app/api/auth/me/route.js`, `src/app/api/auth/profile/route.js` | Handlers ja convertem `AuthError` via `toAuthErrorResponse`. |

## Resultado final

- Status: Aprovado
- Data: 2026-04-24
- Responsavel: Codex

## Pendencias e Riscos Residuais

- Falhas de dependencia continuam sem retry automatico; resposta permanece fail-fast com 503.
- Mensagens de UI podem continuar genericas se o frontend nao diferenciar `AUTH_DEPENDENCY_UNAVAILABLE`.
