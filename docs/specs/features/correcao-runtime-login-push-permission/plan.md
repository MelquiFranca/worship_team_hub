# Plano Tecnico - correcao-runtime-login-push-permission

## 1) Referencia da Spec

- Feature: correcao-runtime-login-push-permission
- Documento: `features/correcao-runtime-login-push-permission/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Introduzir um wrapper client com `dynamic(..., { ssr: false })` para o prompt de permissao e montar esse prompt em `AppNavigation` (client component), removendo o uso no `RootLayout`.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Criar wrapper `PushNotificationPermissionPromptLazy` client-only com dynamic import e `ssr:false`. | AC-01, AC-02 | Manual | Arquivo criado e pronto para uso em componente client |
| T-02 | Remover o prompt do `RootLayout` e montar no `AppNavigation` para evitar renderizacao no boundary server. | AC-01 | Manual | Diff de `layout.js` e `AppNavigation.jsx` |
| T-03 | Executar `lint` e testes unitarios. | AC-03 | Automatizado | Logs de execucao |

## 4) Ordem de Execucao

1. Implementar wrapper client-only.
2. Atualizar ponto de montagem para `AppNavigation`.
3. Executar validacoes automatizadas.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Prompt deixar de aparecer em casos elegiveis | Medio | Baixa | Manter mesma arvore de renderizacao e validar manualmente. |
| Regressao de layout global | Medio | Baixa | Mudanca isolada apenas no ponto de import/renderizacao. |

## 6) Estrategia de Rollout

- Feature flag: Nao.
- Migracao necessaria: Nao.
- Plano de fallback: restaurar import direto anterior.
- Plano de rollback: reverter commits desta feature.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-24 | Carregar prompt via dynamic import sem SSR e montar em `AppNavigation` (client) em vez de `RootLayout`. | Evitar erro intermitente de bootstrap no boundary server do layout. | Estabiliza acesso inicial ao login e reduz risco de runtime no carregamento inicial. |
