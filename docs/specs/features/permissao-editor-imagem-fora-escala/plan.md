# Plano Tecnico - permissao-editor-imagem-fora-escala

## 1) Referencia da Spec

- Feature: permissao-editor-imagem-fora-escala
- Documento: `features/permissao-editor-imagem-fora-escala/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Implementar em incrementos pequenos: primeiro a validacao de contrato no backend para imagem fora da escala, depois a autorizacao de patch por usuario autenticado, em seguida ajustes de UI de cadastro e por fim a liberacao de edicao no feed para componente autorizado nao participante.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Ajustar `POST /api/scales` para validar `imageEditorComponentIds` por existencia no grupo (nao por participacao na escala). | AC-01, AC-02 | Integracao manual | Diff em `src/app/api/scales/route.js` |
| T-02 | Ajustar `PATCH /api/scales/[scaleId]` para validar `imageEditorComponentIds` por grupo e autorizar `imageAttachment` via `session.user.id` para `component-app`. | AC-01, AC-02, AC-03 | Integracao manual | Diff em `src/app/api/scales/[scaleId]/route.js` |
| T-03 | Evoluir `ScaleRegistrationForm` para selecionar e manter editores de imagem fora da escala. | AC-04 | Manual/UI | Diff em `src/components/organisms/ScaleRegistrationForm/ScaleRegistrationForm.jsx` |
| T-04 | Evoluir `ScaleFeed` para liberar `canEditImage` a `component-app` autorizado por `imageEditorComponentIds` sem exigir participacao na escala. | AC-05 | Manual/UI | Diff em `src/components/organisms/ScaleFeed/ScaleFeed.jsx` |
| T-05 | Validar checklist, executar testes disponiveis e registrar evidencias em `validation.md`. | AC-01 a AC-05 | Lint + Manual | Saida de comandos e checklist |

## 4) Ordem de Execucao

1. T-01
2. T-02
3. T-03
4. T-04
5. T-05

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Permitir ID fora da escala sem validar grupo | Alto | Media | Validar existencia de todos os IDs de imagem na colecao de componentes do mesmo grupo. |
| Divergencia entre regra backend e frontend | Medio | Media | Usar `currentUser.id` como chave primaria no feed e manter backend como fonte final de autorizacao. |
| Regressao em permissoes de playlist | Medio | Baixa | Manter validacao de playlist restrita aos componentes escalados sem alteracoes de regra. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: manter lista de `imageEditorComponentIds` vazia para escalas sem delegacao externa.
- Plano de rollback: reverter alteracoes dos arquivos de API e UI da feature.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressões críticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-24 | `imageEditorComponentIds` passa a ser validado por pertencimento ao grupo, nao por participacao na escala. | Permitir delegacao para componente especifico fora da escala. | Amplia flexibilidade mantendo seguranca por escopo de grupo. |
| 2026-04-24 | Autorizacao de edicao de imagem em `component-app` prioriza `session.user.id`. | Evitar dependencia de heuristica por nome/participacao da escala. | Reduz falso bloqueio para editor autorizado fora da escala. |
