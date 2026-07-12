# Plano Técnico - ordenacao-escalas-antiga-recente

## 1) Referência da Spec

- Feature: Ordenacao das escalas da mais antiga para a mais recente
- Documento: `features/ordenacao-escalas-antiga-recente/plan.md`
- Versão da spec: v1

## 2) Escopo

- Alterar a listagem de escalas para retornar/exibir registros em ordem cronologica crescente.
- Considerar `date` como chave principal da ordenacao e `createdAt` como desempate crescente.
- Preservar filtros existentes de `timeScope`, permissao por grupo/categoria e limite da API.

## 3) Não-Escopo

- Nao alterar layout, filtros visuais, textos ou componentes da tela de escalas.
- Nao alterar schema de banco, migracoes ou indices existentes.
- Nao alterar a ordenacao de mensagens, imagens reutilizaveis ou outras listagens.

## 4) Critérios de Aceite

- AC-01: A listagem de escalas deve retornar primeiro a escala com menor `date` e depois as datas mais recentes.
- AC-02: Escalas com a mesma `date` devem manter desempate por `createdAt` crescente.
- AC-03: Os filtros existentes de `timeScope=current-and-future` e `timeScope=all` devem continuar usando os mesmos criterios de inclusao.

## 5) Estratégia de Implementação

Alterar o `sort` da query MongoDB em `GET /api/scales` de decrescente para crescente. A tela `/escalas` consome os itens normalizados pelo cache sem reordenar, entao a mudanca no contrato da API passa a refletir na exibicao.

## 6) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidência |
| --- | --- | --- | --- | --- |
| T-01 | Alterar a ordenacao da query de escalas para `date` e `createdAt` crescentes | AC-01, AC-02 | Unitario/estatico | `src/app/api/scales/route.js` atualizado |
| T-02 | Adicionar teste unitario para o contrato de ordenacao da API | AC-01, AC-02, AC-03 | Unitario | `tests/unit/scales-api-ordering.test.mjs` |
| T-03 | Executar validacao focada e revisar checklist | AC-01, AC-02, AC-03 | Unitario/revisao | `node --test --experimental-default-type=module tests/unit/scales-api-ordering.test.mjs` passou; `npm run test:unit` passou |

## 7) Ordem de Execução

1. Atualizar `src/app/api/scales/route.js`.
2. Adicionar teste unitario para garantir o sort ascendente.
3. Executar testes focados.
4. Registrar evidencias, pendencias e riscos residuais.

## 8) Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
| --- | --- | --- | --- |
| A tela depender implicitamente da ordem decrescente anterior | Medio | Baixa | Escopo solicitado muda explicitamente a ordem para antiga -> recente |
| Teste acoplar a detalhes internos sem validar comportamento | Baixo | Media | Validar o contrato da query e preservar filtros no teste |

## 9) Estratégia de Rollout

- Feature flag: Nao
- Migração necessária: Nao
- Plano de fallback: Reverter o `sort` para `{ date: -1, createdAt: -1 }`.
- Plano de rollback: Reverter este commit/alteracao se a ordem cronologica crescente nao for desejada em producao.

## 10) Critérios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidências registradas
- [x] Sem regressões críticas

## 11) Registro de Decisões Técnicas

| Data | Decisão | Motivação | Impacto |
| --- | --- | --- | --- |
| 2026-07-12 | Ordenar na API, nao no componente visual | O cache e a tela preservam a ordem recebida da API | Mantem a regra em um ponto central |
| 2026-07-12 | Usar `createdAt` crescente como desempate | Evita inversao dentro da mesma data | Mantem ordem antiga -> recente tambem para escalas do mesmo dia |

## 12) Revisão e Fechamento

- Checklist de revisão: `docs/specs/references/review-checklist.md`
- Cobertura AC-01: Coberto por `sort({ date: 1, createdAt: 1 })` e teste unitario focado.
- Cobertura AC-02: Coberto pelo mesmo contrato de ordenacao com `createdAt: 1`.
- Cobertura AC-03: O filtro `mongoFilter` nao foi alterado; o teste protege a alteracao restrita ao `sort`.
- Checklist de revisão:
  - [x] Problema, objetivo, escopo e nao-escopo definidos.
  - [x] ACs mensuraveis e rastreados para T-01, T-02 e T-03.
  - [x] Evidencias registradas por criterio de aceite.
  - [x] Rollout, fallback e rollback definidos.
- Pendências: Nenhuma pendencia bloqueante.
- Riscos residuais: Suite unitária completa passou; nao foram executados testes de integracao/smoke por nao haver alteracao de fluxo autenticado ou visual.
