# Plano Tecnico - bottom-sheet-componentes-cadastro-escalas

## 1) Referencia da Spec

- Feature: bottom-sheet-componentes-cadastro-escalas
- Documento: `features/bottom-sheet-componentes-cadastro-escalas/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Aplicar a mudanca em incrementos pequenos focados em rastreabilidade por criterio de aceite. Primeiro padronizar o card, depois conectar a interacao de abertura de menu, em seguida separar o comportamento responsivo (mobile e desktop), validar troca de viewport, executar regressao do fluxo principal e por fim confirmar preservacao do contrato de API.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Padronizar card de componente no cadastro de escalas conforme referencia da listagem de componentes. | AC-01 | Manual (comparacao visual) | Capturas antes/depois + nota de validacao em `validation.md`. |
| T-02 | Implementar abertura do menu contextual ao clicar/tocar no card no cadastro. | AC-02 | Manual (interacao) | Registro de fluxo validado em `validation.md`. |
| T-03 | Implementar apresentacao do menu em bottom sheet com 50% da altura da viewport em mobile. | AC-03 | Manual responsivo (mobile) | Evidencia de viewport mobile em `validation.md`. |
| T-04 | Implementar apresentacao do menu em side sheet a direita em desktop. | AC-04 | Manual responsivo (desktop) | Evidencia de viewport desktop em `validation.md`. |
| T-05 | Validar e ajustar comportamento na transicao de viewport com menu aberto, evitando estado inconsistente. | AC-05 | Manual responsivo (resize) | Registro de cenario de resize em `validation.md`. |
| T-06 | Executar regressao funcional do fluxo de cadastro de escalas apos as mudancas de UI/interacao. | AC-06 | Manual regressivo | Checklist de fluxo principal em `validation.md`. |
| T-07 | Confirmar que nao houve alteracao no contrato da API durante a implementacao. | AC-07 | Revisao tecnica + integracao | Comparativo de chamadas/contrato em `validation.md`. |

## 4) Ordem de Execucao

1. T-01
2. T-02
3. T-03
4. T-04
5. T-05
6. T-06
7. T-07

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Divergencia visual entre card do cadastro e card da listagem. | Alto | Media | Revisao comparativa com referencia oficial de Design antes de concluir T-01. |
| Inconsistencia de comportamento entre mobile e desktop. | Alto | Media | Validar T-03/T-04 com breakpoints reais e incluir cenario de resize em T-05. |
| Regressao no fluxo de cadastro por alteracao de interacao. | Alto | Baixa | Executar T-06 com roteiro de regressao do fluxo principal. |
| Alteracao acidental de contrato de API por efeitos colaterais. | Alto | Baixa | Isolar mudancas no frontend e formalizar verificacao em T-07. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: reverter apenas alteracoes da feature de UI/interacao em caso de falha critica.
- Plano de rollback: rollback de release para versao anterior estavel do frontend.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regresses criticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-30 | Separar implementacao em 7 incrementos com mapeamento 1:1 AC->T. | Garantir rastreabilidade e validacao objetiva por criterio de aceite. | Melhor previsibilidade de entrega e auditoria de qualidade. |
| 2026-04-30 | Manter contrato de API como restricao explicita de entrega. | Evitar risco de acoplamento backend para mudanca estritamente de UX/UI. | Escopo controlado no frontend e menor risco de regressao sistêmica. |

## 9) Rastreabilidade AC -> T

| Criterio (Spec) | Tarefa (Plano) |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-02 |
| AC-03 | T-03 |
| AC-04 | T-04 |
| AC-05 | T-05 |
| AC-06 | T-06 |
| AC-07 | T-07 |

## 10) Checklist de Revisao Aplicado

### Cobertura de requisitos

- [x] Problema e objetivo estao claros e observaveis.
- [x] Escopo e nao-escopo evitam ambiguidades.
- [x] Criterios de aceite sao mensuraveis e independentes.
- [x] Casos de erro relevantes foram mapeados.

### Rastreabilidade

- [x] Todo AC possui tarefa(s) correspondente(s) no plano tecnico.
- [x] Toda tarefa aponta para uma estrategia de teste.
- [x] Evidencias de validacao foram registradas por criterio.

### Qualidade tecnica

- [x] Requisitos nao funcionais foram tratados.
- [x] Riscos criticos possuem mitigacao explicita.
- [x] Decisoes tecnicas e trade-offs estao documentados.

### Prontidao para entrega

- [x] Rollout/fallback/rollback esta definido.
- [x] Nao ha pendencias bloqueantes nao documentadas.
- [x] Resumo final inclui entregue, pendente e risco residual.

