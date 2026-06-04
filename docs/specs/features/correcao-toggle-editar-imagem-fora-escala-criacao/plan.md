# Plano Tecnico - correcao-toggle-editar-imagem-fora-escala-criacao

## 1) Referencia da Spec

- Feature: correcao-toggle-editar-imagem-fora-escala-criacao
- Documento: `features/correcao-toggle-editar-imagem-fora-escala-criacao/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Aplicar uma correcao pontual no `ScaleRegistrationForm` para que apenas o toggle de playlist exija componente selecionado. O toggle de imagem deve aceitar qualquer componente listado na categoria/grupo.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Ajustar `onToggleImagePermission` para nao exigir `requiresSelectedComponent`. | AC-01, AC-02 | Manual/UI | Diff em `src/components/organisms/ScaleRegistrationForm/ScaleRegistrationForm.jsx` |
| T-02 | Validar envio de `imageEditorComponentIds` com componente fora da escala sem alterar regra de playlist. | AC-03 | Manual + leitura de codigo | `validation.md` + diff |
| T-03 | Revisar checklist de spec e registrar pendencias/riscos residuais. | AC-01, AC-02, AC-03 | Revisao documental | `validation.md` |

## 4) Ordem de Execucao

1. T-01
2. T-02
3. T-03

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Regressao em regra de playlist | Medio | Baixa | Manter `requiresSelectedComponent: true` apenas para playlist. |
| Divergencia entre UI e backend | Medio | Baixa | Confirmar que payload de imagem continua inalterado e backend valida grupo. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: remover selecoes de `imageEditorComponentIds` na UI em caso de incidente.
- Plano de rollback: reverter alteracao unica no `ScaleRegistrationForm`.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressões críticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-05-14 | Remover requisito de componente selecionado apenas para `Editar imagem`. | Regra funcional permite editor de imagem fora da escala. | Corrige bloqueio do checkbox sem afetar playlist. |
