# Validacao - bloqueio-login-grupo-inativo

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | `ensureUserGroupIsActive` aplicado em `authenticateWithPassword` em `src/lib/auth/service.js`. | Login por senha bloqueia grupo inativo antes da emissao de tokens. |
| AC-02 | Pass | `AUTH_GROUP_INACTIVE` em `src/lib/auth/errors.js` e status `GROUP_INACTIVE: 403` em `src/lib/auth/constants.js`. | API passa a ter codigo dedicado para esse cenario. |
| AC-03 | Pass | Mapeamento `AUTH_GROUP_INACTIVE` em `src/components/organisms/LoginCard/LoginCard.jsx`. | Mensagem de status do grupo e exibida no fluxo de login. |
| AC-04 | Pass | `loginWithFallbackAudience` usa `error.code` (`AUTH_AUDIENCE_FORBIDDEN`/`AUTH_ROLE_FORBIDDEN`) em `LoginCard.jsx`. | Fallback nao depende mais do texto da mensagem. |
| AC-05 | Pass | `ensureUserGroupIsActive` aplicado tambem em `refreshAuthSession` e `verifyAccessSession` em `service.js`. | Sessao de grupo inativo e bloqueada em verify/refresh. |

## Validacao de Casos de Erro

| Caso | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| ER-01 | Pass | Mensagem lancada: `Grupo inativo. Status atual do grupo: inactive.` em `service.js`. | Erro dedicado com status HTTP `403`. |
| ER-02 | Pass | Fluxo de credenciais invalidas mantido no mesmo bloco de validacao de senha em `service.js`. | Sem mudanca de contrato para credenciais invalidas. |
| ER-03 | Pass | Regra de audiencia/perfil mantida em `ensureAudienceForLogin`; fallback no frontend por codigo. | Sem regressao nas regras de audiencia. |
| ER-04 | Pass | Check de grupo inativo presente em verify/refresh. | Cobertura para sessao ja emitida. |

## Resultado final

- Status: Validated
- Data: 2026-04-21
- Responsavel: Codex

## Pendencias e Riscos Residuais

- Nao foi executado teste E2E automatizado do fluxo de login nesta entrega.
- Recomenda-se validacao manual com um usuario real de grupo inativo em ambiente de homologacao.
