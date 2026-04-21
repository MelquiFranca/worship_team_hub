# Plano Tecnico - bloqueio-login-grupo-inativo

## 1) Referencia da Spec

- Feature: bloqueio-login-grupo-inativo
- Documento: `features/bloqueio-login-grupo-inativo/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Aplicar bloqueio centralizado por status do grupo no dominio de autenticacao, enriquecendo o usuario autenticavel com `groupStatus` vindo da collection `groups`, e propagar tratamento deterministico no frontend por codigo de erro.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Adicionar codigo `AUTH_GROUP_INACTIVE` e status HTTP correspondente. | AC-02 | Revisao tecnica | Diff em `errors.js` e `constants.js` |
| T-02 | Enriquecer `loadAuthUsers()` com `groupStatus`/`groupName` a partir de `groups`. | AC-01 | Integracao backend | Diff em `userSource.js` |
| T-03 | Aplicar `ensureUserGroupIsActive` em login, verify e refresh. | AC-01, AC-05 | Integracao backend | Diff em `service.js` |
| T-04 | Ajustar `LoginCard` para mapear `AUTH_GROUP_INACTIVE` e fallback por codigo. | AC-03, AC-04 | Integracao frontend | Diff em `LoginCard.jsx` |
| T-05 | Executar lint dos arquivos alterados e registrar validacao. | AC-01, AC-02, AC-03, AC-04, AC-05 | Lint + revisao | Registro em `validation.md`/`evidence.md` |

## 4) Ordem de Execucao

1. T-01
2. T-02
3. T-03
4. T-04
5. T-05

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Lookup de grupo nao encontrar registro e permitir login indevido | Medio | Baixa | Definir fallback seguro de status e validar por revisao de codigo. |
| Frontend mascarar erro de grupo inativo por fallback de audiencia | Alto | Media | Trocar fallback textual por fallback baseado em codigo de erro. |
| Regressao em erros existentes de autenticacao | Medio | Media | Manter mapeamentos atuais e adicionar somente caso novo especifico. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: remover check de grupo inativo no `service.js` se houver impacto inesperado.
- Plano de rollback: reverter alteracoes nos arquivos de auth/login desta feature.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Validacao executada
- [x] Evidencias registradas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-21 | Criar erro dedicado `AUTH_GROUP_INACTIVE` | Evitar ambiguidade de regras e mensagens no frontend | Tratamento deterministico por codigo |
| 2026-04-21 | Aplicar bloqueio tambem em verify/refresh | Cobrir sessoes ja emitidas quando grupo for inativado depois | Seguranca consistente em todo ciclo de sessao |
| 2026-04-21 | Usar fallback de audiencia por codigo, nao por texto | Reduzir falsos positivos em tentativas de fallback | Menor risco de comportamento incorreto no login |
