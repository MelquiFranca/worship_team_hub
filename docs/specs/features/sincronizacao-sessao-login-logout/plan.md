# Plano Tecnico - sincronizacao-sessao-login-logout

## 1) Referencia da Spec

- Feature: sincronizacao-sessao-login-logout
- Documento: `features/sincronizacao-sessao-login-logout/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Centralizar o carregamento de sessao no `AuthSessionContext`, expor um metodo reutilizavel de refresh pos-login e alinhar contextos dependentes (group settings e navegacao) para responder imediatamente a transicoes autenticado/nao autenticado.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Refatorar carregamento de sessao para funcao reutilizavel no contexto de auth | AC-01 | Revisao tecnica | Diff em `src/context/AuthSessionContext.jsx` |
| T-02 | Expor `refreshSession` no contexto e chamar no login antes do redirect | AC-01 | Integracao (fluxo) | Diff em `src/components/organisms/LoginCard/LoginCard.jsx` |
| T-03 | Condicionar sync remoto de configuracoes do grupo ao estado autenticado | AC-02 | Revisao tecnica + manual | Diff em `src/context/GroupSettingsContext.jsx` |
| T-04 | Garantir reset de estado de group settings quando sessao for encerrada | AC-03 | Revisao tecnica + manual | Diff em `src/context/GroupSettingsContext.jsx` |
| T-05 | Limpar estado de perfil no menu quando usuario nao estiver autenticado | AC-03 | Revisao tecnica + manual | Diff em `src/components/organisms/MainBottomNav/MainBottomNav.jsx` |
| T-06 | Executar validacao automatizada minima de qualidade | AC-04 | Lint | Saida de `npm run lint` |

## 4) Ordem de Execucao

1. Implementar refatoracao no contexto de auth e expor refresh.
2. Integrar refresh no fluxo de login.
3. Alinhar group settings com estado autenticado.
4. Ajustar limpeza de estado de UI no logout.
5. Executar lint e consolidar evidencias.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Corrida entre login e refresh de sessao causar estado inconsistente | Alto | Media | Aguardar `refreshSession` antes do redirect no login. |
| Regressao em carregamento inicial da sessao | Medio | Baixa | Reusar a mesma funcao de fetch da sessao para bootstrap e refresh. |
| Persistencia de dados antigos de UI apos logout | Medio | Media | Reset explicito de estados em memoria quando `isAuthenticated=false`. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: manter fallback local de configuracoes em caso de falha remota.
- Plano de rollback: reverter alteracoes dos 4 arquivos de contexto/login/menu.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressoes criticas detectadas em lint

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-21 | Criar `refreshSession` no contexto em vez de duplicar fetch em `LoginCard` | Evitar duplicacao e manter fonte unica de verdade da sessao | Menor risco de divergencia de estado |
| 2026-04-21 | Sincronizar `GroupSettingsContext` com estado autenticado | Garantir aplicacao imediata de tema/permissoes de menu | Remove necessidade de refresh manual |
| 2026-04-21 | Resetar estado de UI no logout alem da limpeza de storage | Eliminar residuos visuais em memoria | Logout consistente e previsivel |
