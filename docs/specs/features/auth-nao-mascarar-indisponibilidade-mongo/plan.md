# Plano Tecnico - auth-nao-mascarar-indisponibilidade-mongo

## 1) Referencia da Spec

- Feature: auth-nao-mascarar-indisponibilidade-mongo
- Documento: `features/auth-nao-mascarar-indisponibilidade-mongo/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Remover fallback silencioso em `loadAuthUsers` e transformar falha de dependencia em `AuthError` tipado (`AUTH_DEPENDENCY_UNAVAILABLE`, 503), preservando o pipeline existente de serializacao de erro nas rotas de autenticacao.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Atualizar `src/lib/auth/userSource.js` para propagar erro de dependencia tipado em vez de retornar `[]` no `catch`. | AC-01, AC-02 | Unitario | Diff em `src/lib/auth/userSource.js` |
| T-02 | Validar rastreabilidade dos handlers de auth que ja usam `isAuthError/toAuthErrorResponse`. | AC-03 | Revisao estatica | Referencias em `src/app/api/auth/*/route.js` |
| T-03 | Criar teste unitario que simula ausencia de `MONGODB_URI` e valida codigo/status do erro. | AC-01, AC-02 | Unitario | `tests/unit/auth-user-source.test.mjs` |

## 4) Ordem de Execucao

1. Implementar T-01.
2. Executar T-02 por revisao estatica.
3. Implementar e executar T-03.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Regressao em chamadas que esperavam array vazio | Medio | Baixa | Rotas de auth ja tratam `AuthError`; validar handlers afetados. |
| Exposicao de detalhes internos no erro | Medio | Baixa | Usar mensagem padrao de `AUTH_DEPENDENCY_UNAVAILABLE`. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: Reverter mudanca em `loadAuthUsers` para comportamento anterior.
- Plano de rollback: `git revert` do commit da feature.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regresses criticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-24 | Falhas de persistencia em `loadAuthUsers` passam a levantar `AuthError` tipado. | Evitar falso positivo de credencial invalida em incidente de infraestrutura. | Login/refresh/me/profile retornam erro de dependencia consistente. |
