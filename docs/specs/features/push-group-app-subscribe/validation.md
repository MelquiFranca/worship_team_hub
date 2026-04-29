# Validacao - push-group-app-subscribe

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | `src/context/AuthSessionContext.jsx`, `src/components/molecules/PushNotificationPermissionPrompt/PushNotificationPermissionPrompt.jsx` | `group-app` passou a ser elegivel no gate de ativacao automatica e manual no cliente. |
| AC-02 | Pass | `src/app/api/push/subscribe/route.js` | Endpoint passou a aceitar `group-app` e tenta resolver componente por `session.user.id` antes do fallback por identidade. |
| AC-03 | Pass | `npm run lint -- --file src/context/AuthSessionContext.jsx --file src/components/molecules/PushNotificationPermissionPrompt/PushNotificationPermissionPrompt.jsx --file src/app/api/push/subscribe/route.js` | Fluxo de `component-app` foi preservado e sem erros de lint nas alteracoes. |

## Resultado final

- Status: Aprovado
- Data: 2026-04-29
- Responsavel: Codex

## Pendencias e Riscos Residuais

- Validacao manual em navegador real para sessao `group-app` ainda recomendada (permissao do navegador + subscribe end-to-end).
- O recebimento efetivo continua dependente da participacao do usuario nos destinatarios de cada disparo de escala/chat.
