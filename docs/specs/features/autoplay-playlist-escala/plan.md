# Plano Tecnico - autoplay-playlist-escala

## 1) Referencia da Spec

- Feature: autoplay-playlist-escala
- Documento: `features/autoplay-playlist-escala/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Executar incrementalmente no `ScaleFeed`: primeiro habilitar fila automatica no embed YouTube, depois introduzir o controle de liga/desliga no card, e por fim endurecer validacao de IDs para reduzir erros de indisponibilidade.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Evoluir geracao de `embedUrl` para suportar fila sequencial automatica no YouTube. | AC-01 | Manual/UI | Diff em `ScaleFeed.jsx` |
| T-02 | Adicionar estado local e controle visual para ativar/desativar autoplay. | AC-02, AC-03 | Manual/UI | Diff em `ScaleFeed.jsx` e `.module.css` |
| T-03 | Restringir fila automatica a IDs YouTube validos (11 chars) extraidos da URL. | AC-04 | Regressao manual + inspecao de codigo | Diff em `ScaleFeed.jsx` |
| T-04 | Atualizar `allow` do `iframe` com `compute-pressure`. | AC-05 | Inspecao de codigo + console check | Diff em `ScaleFeed.jsx` |
| T-05 | Validacao final com lint e registro em docs (`validation` e `evidence`). | AC-01 a AC-05 | Lint | Saida de `npm run lint` |

## 4) Ordem de Execucao

1. T-01
2. T-02
3. T-04
4. T-03
5. T-05

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Player exibir video indisponivel por ID invalido na fila | Alto | Media | Filtrar IDs por regex de 11 caracteres e extrair sempre da URL. |
| Diferenca de comportamento de autoplay por navegador/politica de midia | Medio | Media | Manter toggle de usuario e navegacao manual ativa como fallback. |
| Warning de permissoes poluir console | Baixo | Media | Delegar `compute-pressure` no `allow` do iframe. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: usuario pode desativar autoplay imediatamente no card.
- Plano de rollback: reverter alteracoes em `ScaleFeed.jsx` e `ScaleFeed.module.css`.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressao critica identificada em lint

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-20 | Usar parametros de embed do YouTube (`autoplay` + `playlist`) para sequencia automatica | Evitar integracao mais pesada com IFrame JS API nesta fase | Entrega rapida do fluxo sequencial |
| 2026-04-20 | Expor toggle local por card para autoplay | Dar controle direto ao usuario sem dependencias de backend | UX previsivel e reversivel |
| 2026-04-20 | Considerar valido apenas ID YouTube de 11 caracteres para fila automatica | Reduzir erro `Este video nao esta disponivel` por IDs internos/incompativeis | Maior confiabilidade da reproducao sequencial |
