# Plano Tecnico - integracao-listagens-componentes-escalas

## 1) Referencia da Spec

- Feature: integracao-listagens-componentes-escalas
- Documento: `features/integracao-listagens-componentes-escalas/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Executar a integracao em incrementos pequenos para reduzir regressao: primeiro consolidar contrato esperado de dados e pontos de consumo, depois conectar endpoints de componentes e escalas, em seguida adicionar camada de adaptacao para payload desnormalizado, finalizar com estados de UI, validacao de permissao/sessao e cobertura de testes/evidencias.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Definir contrato de dados esperado por `ComponentsGallery` e `ScaleFeed` (campos obrigatorios/opcionais e fallbacks) e registrar no codigo/documentacao tecnica. | AC-08 | Unitario (contrato) | Arquivo de tipos/interfaces + teste de contrato |
| T-02 | Implementar consumo de `GET /api/components` na camada de dados da tela de componentes, removendo dependencia de mock no caminho principal. | AC-01 | Integracao | Teste de chamada HTTP + diff de importacao |
| T-03 | Implementar consumo de `GET /api/scales` na camada de dados da tela de escalas, removendo dependencia de mock no caminho principal. | AC-02 | Integracao | Teste de chamada HTTP + diff de importacao |
| T-04 | Criar adaptadores de normalizacao para tratar dados desnormalizados das APIs antes de entregar para UI. | AC-06 | Unitario + integracao | Suite de testes do adaptador com payload irregular |
| T-05 | Implementar estados de `loading`, `vazio`, `erro` e `retry` nas duas telas/listagens. | AC-03, AC-04, AC-05 | Integracao + manual | Capturas de tela + testes de estado |
| T-06 | Integrar regras existentes de permissao/sessao no fluxo das requisicoes e renderizacao de listagens. | AC-07 | Integracao | Testes para `200`, `401` e `403` |
| T-07 | Revisar e remover referencias residuais a mocks locais dos caminhos de exibicao de `componentes` e `escalas`. | AC-01, AC-02 | Revisao tecnica + smoke manual | Busca de codigo (`rg`) e checklist de regressao |
| T-08 | Consolidar cobertura minima de testes e atualizar `validation.md`/`evidence.md` com resultados finais. | AC-08 | Unitario + integracao + manual | Arquivos de validacao e evidencias preenchidos |

## 4) Ordem de Execucao

1. Formalizar contrato de dados e pontos de integracao (T-01).
2. Conectar endpoint de componentes e remover mock principal (T-02).
3. Conectar endpoint de escalas e remover mock principal (T-03).
4. Implementar adaptacao de payload desnormalizado (T-04).
5. Implementar estados de UI e retry nas duas listagens (T-05).
6. Aplicar regras de permissao/sessao e validar cenarios de acesso (T-06).
7. Executar limpeza de referencias residuais a mocks e smoke final (T-07).
8. Fechar testes e registrar evidencias/validacao (T-08).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Divergencia entre contrato retornado pela API e campos esperados pela UI | Alto | Alta | Introduzir adaptador com fallback e testes de contrato antes da troca completa. |
| Regras de sessao/permissao nao aplicadas uniformemente nos dois endpoints | Alto | Media | Reusar mesma camada de cliente autenticado e cobrir `401/403` em testes de integracao. |
| Regressao visual nos estados de listagem (loading/erro/vazio) | Medio | Media | Validar cenarios com testes de estado e checklist manual por tela/resolucao. |
| Dependencia de ambiente backend instavel para validacao | Medio | Media | Priorizar mocks de rede controlados em teste e smoke em ambiente integrado quando disponivel. |

## 6) Estrategia de Rollout

- Feature flag: Sim (habilitacao controlada da integracao real por ambiente)
- Migracao necessaria: Nao
- Plano de fallback: manter caminho de mock local isolado por flag apenas para contingencia de homologacao.
- Plano de rollback: desabilitar flag de integracao e restaurar fluxo estavel anterior enquanto corrige incidente.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-15 | Introduzir camada de adaptacao de payload antes da UI | Evitar quebra por dados desnormalizados dos endpoints | `ComponentsGallery` e `ScaleFeed` recebem contrato estavel |
| 2026-04-15 | Tratar loading/vazio/erro/retry como requisito minimo nas duas telas | Garantir UX previsivel e resiliente em integracao real | Reduz chamados de suporte por tela em branco/falha silenciosa |
| 2026-04-15 | Aplicar rollout controlado por flag de ambiente | Minimizar risco de regressao em producao | Permite fallback rapido sem redeploy emergencial |
