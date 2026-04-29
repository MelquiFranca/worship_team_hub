# Plano Tecnico - push-group-app-subscribe

## 1) Referencia da Spec

- Feature: push-group-app-subscribe
- Documento: `features/push-group-app-subscribe/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Ajustar o gate de elegibilidade no cliente para `component-app` e `group-app`, e liberar a audiencia `group-app` no endpoint de subscribe mantendo os mesmos controles de autenticacao, group scope e normalizacao de subscription.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Atualizar `AuthSessionContext` para considerar `group-app` elegivel para auto-ativacao e solicitacao manual de permissao. | AC-01 | Validacao de codigo | Diff em `src/context/AuthSessionContext.jsx` |
| T-02 | Ajustar mensagem de feedback do prompt para refletir elegibilidade de `group-app`. | AC-01 | Validacao de codigo | Diff em `PushNotificationPermissionPrompt.jsx` |
| T-03 | Permitir audiencia `group-app` no `/api/push/subscribe` e resolver componente da sessao por `_id` antes do fallback atual. | AC-02 | Validacao de codigo | Diff em `src/app/api/push/subscribe/route.js` |
| T-04 | Revisar regressao do fluxo `component-app` e manter contrato da API. | AC-03 | Validacao de codigo | Revisao final + `validation.md` |

## 4) Ordem de Execucao

1. Ajustar elegibilidade no contexto de sessao.
2. Ajustar texto/UX do prompt.
3. Ajustar backend de subscribe.
4. Revisar rastreabilidade, checklist e validacao.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| `group-app` sem componente correspondente no grupo | Medio | Media | Buscar por `_id` e manter fallback por identidade; retornar 404 controlado. |
| Regressao no fluxo `component-app` | Alto | Baixa | Preservar caminho atual e cobertura de validacao por codigo. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: reverter gate de audiencia para estado anterior.
- Plano de rollback: rollback dos 3 arquivos alterados.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [ ] Testes executados
- [x] Evidencias registradas
- [x] Sem regresses criticas identificadas em revisao de codigo

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-29 | Resolver componente por `session.user.id` no subscribe antes de fallback por identidade | `group-app` ja e usuario autenticado baseado em componente no banco | Reduz falsos negativos no registro de subscription |
