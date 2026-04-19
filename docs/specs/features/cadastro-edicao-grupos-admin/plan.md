# Plano Tecnico - cadastro-edicao-grupos-admin

## 1) Referencia da Spec

- Feature: cadastro-edicao-grupos-admin
- Documento: `features/cadastro-edicao-grupos-admin/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Executar em camadas:
1. consolidar regras de normalizacao/serializacao para grupo/settings/gestor;
2. expor APIs administrativas para criar, consultar e editar;
3. construir UI reutilizavel para cadastro/edicao;
4. integrar navegacao na listagem admin.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Criar utilitarios de dominio admin de grupos (normalizacao, serializacao, validacao). | AC-01, AC-07 | Revisao tecnica | `src/lib/admin/groupAdmin.js` |
| T-02 | Implementar `GET /api/admin/groups/[groupId]`. | AC-02 | Integracao backend | `src/app/api/admin/groups/[groupId]/route.js` |
| T-03 | Implementar `POST /api/admin/groups` e `PATCH /api/admin/groups/[groupId]` com persistencia de gestor `group-app`. | AC-01, AC-03, AC-07 | Integracao backend | Rotas API admin |
| T-04 | Criar `AdminGroupForm` e paginas `/admin/grupos/novo` e `/admin/grupos/[groupId]/editar`. | AC-04, AC-05, AC-07 | Manual/UI | Componentes/paginas criados |
| T-05 | Integrar atalhos de navegacao na listagem e menu admin para novo fluxo. | AC-06 | Manual/UI | Ajustes em `/admin/grupos` e `AdminMainNav` |
| T-06 | Executar validacao final (`npm run lint`) e registrar documentacao final. | AC-01 a AC-07 | Lint + revisao | `validation.md` e `evidence.md` |

## 4) Ordem de Execucao

1. T-01
2. T-02
3. T-03
4. T-04
5. T-05
6. T-06

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Duplicidade de username do gestor causar ambiguidade no login | Alto | Media | Validacao de conflito no backend com resposta `409`. |
| Inconsistencia entre `groups` e `group_settings` em falha parcial no cadastro | Medio | Baixa | Fluxo com rollback best-effort na criacao. |
| Regressao de navegacao admin | Medio | Baixa | Atualizar links de forma explicita e validar rotas manualmente. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: manter uso apenas da listagem admin anterior caso APIs novas falhem.
- Plano de rollback: reverter arquivos novos/alterados da feature admin de grupos.

## 7) Criterios de Pronto por Incremento

- [x] Implementacao concluida
- [x] Validacao executada
- [x] Documentacao completa registrada

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-19 | Reutilizar `components` para gestor `group-app` | Compatibilidade com mecanismo atual de autenticacao | Evita criar nova fonte de usuarios nesta etapa |
| 2026-04-19 | Centralizar normalizacao/serializacao em `src/lib/admin/groupAdmin.js` | Reduzir duplicacao entre endpoints e telas | Menor risco de divergencia de regra |
| 2026-04-19 | Formulario unico (`AdminGroupForm`) para criar e editar | Consistencia de UX e manutencao | Evolucao mais simples do fluxo admin |
