# Plano Tecnico - filtro-escalas-usuario-logado

## 1) Referencia da Spec

- Feature: filtro-escalas-usuario-logado
- Documento: `features/filtro-escalas-usuario-logado/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Implementar o novo filtro no client da tela de escalas reaproveitando a sessao autenticada e o matcher de participacao ja existente (`getCurrentUserMemberId`). O fluxo sera: criar estado do filtro, derivar lista exibida em memoria e propagar flag para destaque no cabecalho dos cards quando o filtro estiver desligado.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Adicionar props/estado e controle visual do filtro “somente minhas escalas” no feed. | AC-01 | Manual | `validation.md` |
| T-02 | Derivar lista exibida com filtro de participacao do usuario logado, preservando combinacao com filtro de periodo atual. | AC-02, AC-04 | Manual | `validation.md` |
| T-03 | Aplicar destaque no cabecalho do card para escalas com participacao do usuario quando filtro estiver inativo. | AC-03 | Manual | `validation.md` |
| T-04 | Executar verificacoes de regressao do fluxo de carregamento/estado vazio e atualizar validacao final. | AC-04 | Manual | `validation.md` |

## 4) Ordem de Execucao

1. Ajustar componente `ScaleFeed` para receber/gerenciar filtro de participacao.
2. Implementar filtragem derivada e contagem/estado vazio com base na lista filtrada.
3. Adicionar estilo e condicao de destaque no cabecalho dos cards.
4. Validar combinacao de filtros e registrar evidencias.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Inconsistencia no match de usuario escalado em alguns nomes | Medio | Media | Reaproveitar funcao central `isCurrentUserMember` ja utilizada no modulo e validar manualmente com cenarios de participacao e nao participacao. |
| Estado vazio confundir usuario ao combinar filtros | Medio | Baixa | Manter mensagem padrao de lista vazia e validar comportamento com filtro ativo/inativo. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: remover condicoes/controle novo e manter exibicao atual de todas as escalas.
- Plano de rollback: revert dos arquivos alterados no frontend da tela de escalas.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regresses criticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-28 | Filtragem “somente minhas escalas” no client (sem alteracao da API) | Dados necessarios ja estao disponiveis em memoria no `ScaleFeed` | Entrega rapida com baixo risco de regressao backend |
