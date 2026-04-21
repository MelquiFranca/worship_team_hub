# Plano Técnico - padronizacao-headers-telas-principais

## 1) Referência da Spec

- Feature: padronizacao-headers-telas-principais
- Documento: `features/padronizacao-headers-telas-principais/spec.md`
- Versão da spec: v1

## 2) Estratégia de Implementação

Aplicar padronização incremental por tela, preservando o comportamento existente e ajustando somente estrutura visual/textual dos headers.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidência |
| --- | --- | --- | --- | --- |
| T-01 | Padronizar header de `componentes` no padrão visual de referência | AC-01 | Manual + revisão de código | Diff em `ComponentsGallery.*` |
| T-02 | Padronizar header de `cadastro-componentes` no padrão visual de referência | AC-01 | Manual + revisão de código | Diff em `src/app/cadastro-componentes/*` |
| T-03 | Padronizar header de `configuracoes-gerais-grupo` no padrão visual de referência | AC-01 | Manual + revisão de código | Diff em `GroupGeneralSettings.*` |
| T-04 | Padronizar textos dos cards de resumo em tom/nomenclatura comum | AC-02 | Revisão textual no JSX | Diff dos textos em JSX |
| T-05 | Ajustar `escalas` para manter somente filtro no resumo do header | AC-03 | Manual + revisão de código | Diff em `ScaleFeed.*` |
| T-06 | Executar validação de lint | AC-01, AC-02, AC-03 | Lint | `npm run lint` |

## 4) Ordem de Execução

1. Aplicar padrão de header nas três telas com resumo completo.
2. Uniformizar textos dos cards de resumo.
3. Ajustar exceção funcional da tela `escalas` para manter apenas filtro.
4. Executar lint e registrar evidências.

## 5) Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
| --- | --- | --- | --- |
| Divergência visual em mobile | Médio | Média | Ajustes responsivos já existentes em CSS modules por tela. |
| Regressão do comportamento do filtro em `escalas` | Médio | Baixa | Manter apenas alteração estrutural/textual do header, sem mudar regra de estado. |

## 6) Estratégia de Rollout

- Feature flag: Não
- Migração necessária: Não
- Plano de fallback: reverter alterações dos arquivos de header por tela.
- Plano de rollback: `git revert` do commit da feature.

## 7) Critérios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidências registradas
- [x] Sem regressões críticas

## 8) Registro de Decisões Técnicas

| Data | Decisão | Motivação | Impacto |
| --- | --- | --- | --- |
| 2026-04-21 | Usar padrão visual do `cadastro-escalas` como referência única | Reduzir inconsistência de UI entre telas principais | Melhora coesão visual do produto |
| 2026-04-21 | Em `escalas`, manter apenas filtro no resumo do header | Decisão explícita do usuário/produto | Header mais enxuto sem campos de contagem |
| 2026-04-21 | Padronizar nomenclatura para `Contexto`, `Status`, `Detalhe` | Uniformizar tom textual e facilitar leitura | Consistência semântica entre telas |
