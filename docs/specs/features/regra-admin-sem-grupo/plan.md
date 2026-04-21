# Plano Tecnico - regra-admin-sem-grupo

## 1) Referencia da Spec

- Feature: regra-admin-sem-grupo
- Documento: `features/regra-admin-sem-grupo/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Aplicar normalizacao de `groupId` por tipo de permissao na borda das APIs de componentes e no mapeamento de usuarios de autenticacao para eliminar estados inconsistentes de admin vinculado a grupo.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Ajustar `POST /api/components` para forcar `groupId: null` em `admin-panel` e refletir na serializacao. | AC-01 | Integracao + lint | `src/app/api/components/route.js` |
| T-02 | Ajustar `PATCH /api/components/[componentId]` para normalizar `groupId` conforme permissao e manter validacao de conflito. | AC-02 | Integracao + lint | `src/app/api/components/[componentId]/route.js` |
| T-03 | Ajustar `loadAuthUsers` para aceitar admin sem grupo e expor `groupId: null`. | AC-03 | Integracao + lint | `src/lib/auth/userSource.js` |
| T-04 | Validar nao regressao para perfis nao admin via revisao de logica e lint geral. | AC-04 | Regressao + lint | `npm run lint` |

## 4) Ordem de Execucao

1. Corrigir normalizacao na rota de criacao.
2. Corrigir normalizacao na rota de edicao.
3. Corrigir mapeamento de autenticacao.
4. Executar validacao final (lint + revisao de diff).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Colisao de username ao mudar escopo de grupo para `null` em admin | Medio | Media | Revalidar consulta de duplicidade com `nextGroupId` no patch de edicao. |
| Regressao para perfis `group-app` e `component-app` | Alto | Baixa | Isolar regra de normalizacao apenas quando permissao for `admin-panel`. |
| Divergencia entre dado persistido e dado serializado | Medio | Baixa | Aplicar mesma funcao de normalizacao na persistencia e na serializacao. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao (apenas para novos writes; legado pode ser tratado em etapa separada)
- Plano de fallback: reverter os 3 arquivos alterados.
- Plano de rollback: `git revert` do commit da feature.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressos criticos

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-21 | Centralizar regra em helper `resolveGroupIdForPermissionType` nas rotas de componentes | Evitar duplicacao e divergencia entre create/edit/serialize | Consistencia de regra com menor risco de manutencao |
| 2026-04-21 | Permitir admin sem `groupId` em `userSource` | Regra de negocio define admin global | Remove bloqueio indevido de login para admin sem grupo |
