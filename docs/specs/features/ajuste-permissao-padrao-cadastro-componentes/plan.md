# Plano Tecnico - ajuste-permissao-padrao-cadastro-componentes

## 1) Referencia da Spec

- Feature: ajuste-permissao-padrao-cadastro-componentes
- Documento: `features/ajuste-permissao-padrao-cadastro-componentes/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Aplicar ajuste pontual no estado inicial e no reset do formulario de cadastro de componentes, seguido de atualizacao dos labels exibidos no select, preservando os valores tecnicos enviados para API.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Definir constante de permissao padrao (`component-app`) e aplicar no estado inicial/reset do formulario. | AC-01 | Manual | Trecho de codigo alterado em `ComponentRegistrationForm.jsx` |
| T-02 | Atualizar labels exibidos no select para `Componente` e `Organizador` mantendo `value` tecnico existente. | AC-02 | Manual | Trecho de codigo alterado no select em `ComponentRegistrationForm.jsx` |
| T-03 | Verificar que submit continua enviando `permissionType` tecnico sem alteracao de contrato. | AC-03 | Revisao de codigo + manual | Revisao de `handleSubmit` e evidencia em `validation.md` |

## 4) Ordem de Execucao

1. Ajustar valor padrao do campo (T-01).
2. Atualizar labels amigaveis no select (T-02).
3. Validar payload e registrar evidencias (T-03).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Iniciar valor padrao incorreto em fluxo de edicao | Medio | Baixa | Manter carregamento de dados de edicao sobrescrevendo o estado inicial quando houver `componentId`. |
| Regressao no payload enviado para API | Alto | Baixa | Nao alterar `value` das opcoes, apenas labels e estado inicial. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: reverter ajustes no formulario para estado anterior.
- Plano de rollback: rollback do commit da feature em caso de regressao de cadastro.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressoes criticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-24 | Definir `component-app` como padrao no formulario | Reduzir atrito no cadastro e alinhar com comportamento esperado | Novos cadastros iniciam com permissao padrao correta |
| 2026-04-24 | Exibir labels amigaveis mantendo `value` tecnico | Melhorar UX sem quebrar contrato de API | Sem impacto no backend, melhora clareza para usuario |
