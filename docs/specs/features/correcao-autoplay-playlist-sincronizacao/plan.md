# Plano Tecnico - correcao-autoplay-playlist-sincronizacao

## 1) Referencia da Spec

- Feature: correcao-autoplay-playlist-sincronizacao
- Documento: `features/correcao-autoplay-playlist-sincronizacao/plan.md`
- Versao da spec: v1
- Data: 2026-07-12
- Status: Implementado

## 2) Problema e Objetivo

Problema: com `Executar playlist automaticamente em sequencia` ativo, o iframe do YouTube avanca internamente pela fila enquanto o estado `currentIndex` do React permanece no item anterior. Ao usar `Proximo`, `Anterior` ou dots apos esse avanco interno, uma musica pode repetir e outra pode ser pulada, com maior visibilidade no final da lista.

Objetivo: manter uma unica fonte de verdade para a posicao da playlist no `PlaylistPanel`, garantindo que autoplay sequencial e navegacao manual avancem pela ordem visual da lista sem perda ou repeticao indevida.

## 3) Escopo

- Corrigir a sincronizacao entre fim de video YouTube e `currentIndex` do React.
- Evitar que o iframe receba uma fila sequencial propria quando a UI precisa controlar o indice.
- Preservar o toggle `Executar playlist automaticamente em sequencia`.
- Preservar navegacao manual por `Anterior`, `Proximo` e dots.
- Adicionar teste automatizado para geracao de URL de embed sem fila interna do YouTube e com suporte a eventos da IFrame API.

## 4) Nao-Escopo

- Persistir preferencia de autoplay por usuario.
- Implementar autoplay sequencial para Vimeo.
- Reordenar ou redesenhar a UI da playlist.
- Tratar indisponibilidade regional/remocao de videos no YouTube.

## 5) Criterios de Aceite Testaveis

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Com autoplay ativo, ao terminar um video YouTube, o proximo item da playlist visual passa a ser o `currentIndex` e o embed carrega esse item. | Inspecao de codigo + teste manual/automatizado do fluxo de fim via IFrame API. | Alta |
| AC-02 | O embed de um video individual nao recebe mais uma fila interna `playlist=` com os proximos IDs quando o card controla a sequencia. | Teste unitario de helper de URL. | Alta |
| AC-03 | Ao usar `Proximo`, `Anterior` ou dots com autoplay ativo, nao ha repeticao causada por indice React atrasado. | Inspecao de codigo + teste manual dirigido. | Alta |
| AC-04 | Com autoplay desativado, o fim do video nao avanca o `currentIndex` automaticamente. | Inspecao de codigo + teste manual dirigido. | Alta |
| AC-05 | Links nao-YouTube continuam com o fallback/embed existente, sem receber logica da IFrame API. | Inspecao de codigo. | Media |

## 6) Estrategia de Implementacao

Extrair os helpers puros de playlist/autoplay para um modulo testavel. Alterar `PlaylistPanel` para usar YouTube IFrame API somente quando o item atual e um YouTube valido, com `enablejsapi=1` no embed. Quando o player emitir estado `ENDED` e o toggle estiver ativo, o React atualiza `currentIndex` para o proximo item, mantendo UI e iframe sincronizados. A fila interna `playlist=` sera removida do embed individual para eliminar avanco duplo.

## 7) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Extrair helpers de autoplay/URL para modulo testavel sem mudar comportamento publico alem da fila interna. | AC-02, AC-05 | Unitario | `tests/unit/playlist-autoplay.test.mjs` |
| T-02 | Ajustar `buildYouTubeEmbedUrl` para habilitar JS API e nao enviar `playlist=` para videos individuais. | AC-02 | Unitario | `node --test --experimental-default-type=module tests/unit/playlist-autoplay.test.mjs` |
| T-03 | Integrar IFrame API no `PlaylistPanel` para avancar `currentIndex` ao receber `ENDED` apenas com autoplay ativo. | AC-01, AC-03, AC-04 | Inspecao/manual | Diff em `ScaleFeed.jsx` |
| T-04 | Executar testes e lint possiveis, revisar checklist e registrar evidencias. | AC-01 a AC-05 | Unitario/integracao/smoke/lint | `npm run test:unit`; `npm test`; `npm run lint` |

## 8) Ordem de Execucao

1. T-01
2. T-02
3. T-03
4. T-04

## 9) Rastreabilidade AC -> Tarefas

| Criterio | Tarefa(s) |
| --- | --- |
| AC-01 | T-03, T-04 |
| AC-02 | T-01, T-02, T-04 |
| AC-03 | T-03, T-04 |
| AC-04 | T-03, T-04 |
| AC-05 | T-01, T-03, T-04 |

## 10) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| API do YouTube nao carregar em algum navegador/rede | Medio | Media | Manter navegacao manual e embed funcional; autoplay automatico depende da API apenas para o evento de fim. |
| Evento `ENDED` disparar com closures antigas | Alto | Media | Usar refs para playlist, toggle e indice atual. |
| Alteracao quebrar links de playlist do YouTube (`videoseries`) | Medio | Baixa | Manter caminho de URL com `list` separado da logica de video individual. |

## 11) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: usuario pode desativar o toggle e navegar manualmente.
- Plano de rollback: reverter alteracoes em `ScaleFeed.jsx`, modulo de helper e teste unitario desta correcao.

## 12) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressoes criticas

## 13) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-07-12 | Usar React como fonte unica de verdade para indice da playlist | Evitar avanco duplo entre iframe e estado local | Remove repeticao/pulo causado por estado atrasado |
| 2026-07-12 | Usar YouTube IFrame API apenas para evento de fim | Necessario sincronizar autoplay sem entregar fila ao iframe | Adiciona dependencia runtime do script oficial para autoplay sequencial |
| 2026-07-12 | Parar autoplay sequencial no ultimo item em vez de dar volta automatica | O comportamento anterior da fila do YouTube nao dava wrap garantido; wrap manual segue em `Proximo` | Evita repeticao automatica no fim da lista |

## 14) Evidencias por Criterio de Aceite

| Criterio | Resultado | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | `ScaleFeed.jsx` usa `YT.PlayerState.ENDED` para chamar `setCurrentIndex(getNextSequentialPlaylistIndex(...))`. | Validado por inspecao; depende da API runtime do YouTube no navegador. |
| AC-02 | Pass | `tests/unit/playlist-autoplay.test.mjs` confirma ausencia de parametro `playlist` no embed individual. | `node --test --experimental-default-type=module tests/unit/playlist-autoplay.test.mjs` passou com 4/4 testes; `npm test` passou. |
| AC-03 | Pass | `currentIndex` e atualizado pelo React tanto no evento `ENDED` quanto em `Proximo`, `Anterior` e dots. | Validado por inspecao e teste de helper do proximo indice. |
| AC-04 | Pass | Callback de `ENDED` retorna sem acao quando `autoPlayEnabledRef.current` e falso. | Validado por inspecao. |
| AC-05 | Pass | `toEmbedUrl` manteve caminho Vimeo e `videoseries`; IFrame API so inicializa com `currentYouTubeVideoId`. | Validado por inspecao e teste de IDs validos. |

## 15) Revisao pelo Checklist

- [x] Problema e objetivo claros e observaveis.
- [x] Escopo e nao-escopo definidos.
- [x] Criterios de aceite mensuraveis e independentes.
- [x] Todo AC possui tarefa(s) correspondente(s).
- [x] Toda tarefa aponta para estrategia de teste.
- [x] Evidencias registradas por criterio.
- [x] Riscos criticos mitigados ou documentados.
- [x] Pendencias e riscos residuais documentados.

## 16) Pendencias e Riscos Residuais

- Nao foi executado teste manual em navegador real nesta rodada.
- O autoplay sequencial depende do carregamento da YouTube IFrame API; se o script for bloqueado por rede/extensao, a navegacao manual continua disponivel.
- Politicas do navegador/YouTube ainda podem impedir autoplay com audio sem interacao do usuario.
- `npm run lint` passou, mas manteve warning pre-existente em `src/context/AppDataCacheContext.jsx` sobre dependencia de `useMemo`.
