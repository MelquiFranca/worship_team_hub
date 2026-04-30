# Plano Tecnico - correcao-hidratacao-edicao-escala-permissoes

## 1) Referencia da Spec

- Feature: correcao-hidratacao-edicao-escala-permissoes
- Documento: `features/correcao-hidratacao-edicao-escala-permissoes/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Corrigir a hidratação local no `ScaleRegistrationForm` para que componentes adicionados via fallback da escala carreguem `categoryTagIds` consistentes com a categoria ativa (ou categoria informada no payload), evitando que o filtro por categoria os esconda antes da renderizacao dos checks de permissao.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Ajustar normalizacao/merge de componentes da escala para preservar `categoryTagIds` no estado local do formulario. | AC-01, AC-02 | Manual | Diff em `ScaleRegistrationForm.jsx` |
| T-02 | Validar ausencia de regressao no submit e registrar resultado em `validation.md`. | AC-02, AC-03 | Manual | `validation.md` |

## 4) Ordem de Execucao

1. Ajustar normalizacao e merge de componentes no formulario.
2. Validar visualizacao de componentes e permissoes na edicao.
3. Registrar validacao e riscos residuais.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Marcar categoria incorreta para componente fallback | Medio | Baixa | Usar categoria do item quando presente; fallback para categoria ativa da escala. |
| Regressao em cadastro novo | Medio | Baixa | Limitar ajuste ao caminho de normalizacao/merge sem alterar payload de submit. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: manter comportamento anterior removendo apenas o patch de merge/normalizacao.
- Plano de rollback: reverter alteracoes em `ScaleRegistrationForm.jsx`.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressões críticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-29 | Incluir `categoryTagIds` no fallback de componentes da escala e propagar no merge | Evitar ocultacao indevida pelo filtro por categoria na edicao | Mantem componentes/permissoes visiveis durante hidratacao da escala |
