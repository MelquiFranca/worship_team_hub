# Plano Tecnico - remocao-botoes-atualizacao-componentes-escalas

## 1) Referencia da Spec

- Feature: remocao-botoes-atualizacao-componentes-escalas
- Documento: `features/remocao-botoes-atualizacao-componentes-escalas/plan.md`
- Versao da spec: v1

## 2) Escopo

- Remover a acao manual de atualizacao dos headers das paginas `componentes` e `escalas`.
- Preservar o carregamento normal dos dados por hidratacao da pagina ao entrar ou recarregar a rota.
- Preservar caminhos automaticos de sincronizacao existentes fora dos botoes removidos.

## 3) Nao-Escopo

- Alterar o comportamento de cache e hidratacao em `AppDataCacheContext`.
- Remover o componente compartilhado `AppDataRefreshHeaderCard` de outras telas.
- Introduzir nova infraestrutura de SSE nesta tarefa.

## 4) Criterios de Aceite

| ID | Criterio |
| --- | --- |
| AC-01 | A pagina `componentes` nao exibe mais CTA ou card de atualizacao manual no header. |
| AC-02 | A pagina `escalas` nao exibe mais CTA ou card de atualizacao manual no header. |
| AC-03 | O carregamento dos dados nas paginas `componentes` e `escalas` continua ocorrendo pela hidratacao normal da pagina, sem dependencia do botao removido. |
| AC-04 | Nenhuma alteracao desta tarefa bloqueia fluxos automaticos de sincronizacao ja existentes fora do botao manual. |

## 5) Estrategia de Implementacao

Aplicar mudanca pontual nas composicoes das duas telas, removendo apenas a ligacao do CTA manual. O contexto de cache compartilhado sera preservado para manter hidratacao inicial e demais consumidores existentes.

## 6) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Remover o card/botao de atualizacao manual da pagina `componentes`, limpando importacoes e props nao utilizadas. | AC-01, AC-03 | Revisao de codigo + lint | Diff em `src/app/componentes/ComponentsPageClient.jsx` |
| T-02 | Remover o card/botao de atualizacao manual do header de `escalas`, limpando props e dependencias nao utilizadas entre page/client e feed. | AC-02, AC-03 | Revisao de codigo + lint | Diff em `src/app/escalas/ScalesPageClient.jsx` e `src/components/organisms/ScaleFeed/ScaleFeed.jsx` |
| T-03 | Validar que a tarefa nao altera o fluxo compartilhado de hidratacao/cache e registrar achados sobre sincronizacao automatica existente. | AC-04 | Revisao tecnica + lint | Diff zero em `AppDataCacheContext` + observacao neste plano |

## 7) Ordem de Execucao

1. Registrar escopo, rastreabilidade e riscos da remocao.
2. Ajustar a tela `componentes`.
3. Ajustar a tela `escalas` e o `ScaleFeed`.
4. Executar lint e registrar evidencias por criterio de aceite.

## 8) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Remocao deixar imports ou props mortos e quebrar build | Medio | Baixa | Limpar destructuring, importacoes e props no mesmo incremento. |
| Regressao visual no header de `escalas` por remocao do bloco de acoes | Medio | Baixa | Manter estrutura do header e remover apenas o container condicional da acao. |
| Expectativa de SSE nao estar coberta no codigo atual | Medio | Media | Documentar que esta tarefa nao adiciona SSE nova e nao altera fluxos automaticos existentes encontrados no repositorio. |

## 9) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: restaurar a composicao anterior dos headers nas duas telas.
- Plano de rollback: reverter o commit da feature.

## 10) Rastreabilidade AC -> Tarefas

- AC-01 -> T-01
- AC-02 -> T-02
- AC-03 -> T-01, T-02
- AC-04 -> T-03

## 11) Estrategia de Testes

- Lint do projeto para capturar imports/props mortos e regressao sintatica.
- Revisao de codigo focada em confirmar que a hidratacao inicial segue vindo de `useAppDataCache`.

## 12) Evidencias por Criterio de Aceite

| AC | Status | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | `src/app/componentes/ComponentsPageClient.jsx:10-43` | A pagina `componentes` deixou de importar/renderizar `AppDataRefreshHeaderCard` e manteve apenas o resumo do header. |
| AC-02 | Pass | `src/app/escalas/ScalesPageClient.jsx:11-27`; `src/components/organisms/ScaleFeed/ScaleFeed.jsx:2090-2264` | `ScalesPageClient` nao repassa mais `onRefresh/isRefreshing`, e o `ScaleFeed` nao renderiza mais o card de refresh no topo. |
| AC-03 | Pass | `src/app/componentes/ComponentsPageClient.jsx:10`; `src/app/escalas/ScalesPageClient.jsx:11`; `src/context/AppDataCacheContext.jsx:415-453` | As duas telas continuam consumindo `useAppDataCache`, e a hidratacao inicial segue sendo disparada pelo `useEffect` do provider ao carregar/autenticar. |
| AC-04 | Pass | `src/context/AppDataCacheContext.jsx:384-413`; varredura local sem mudancas em SSE | Nenhuma mudanca foi feita no fluxo compartilhado de refresh/hidratacao; nao foi encontrado SSE explicito no repositorio para preservar ou ajustar nesta tarefa. |

## 13) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressao critica

## 14) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-07-04 | Remover apenas os gatilhos manuais de refresh nas telas `componentes` e `escalas` | Atender a solicitacao sem expandir escopo para outras telas que ainda usam refresh manual | Mudanca pequena e localizada |
| 2026-07-04 | Preservar `AppDataCacheContext` sem alteracoes | O contexto continua responsavel pela hidratacao inicial e ainda atende outras telas | Menor risco de regressao transversal |

## 15) Revisao com Checklist

- [x] Problema e objetivo estao claros e observaveis.
- [x] Escopo e nao-escopo evitam ambiguidades.
- [x] Criterios de aceite sao mensuraveis e independentes.
- [x] Casos de erro relevantes foram mapeados.
- [x] Todo AC possui tarefa correspondente no plano tecnico.
- [x] Toda tarefa aponta para uma estrategia de teste.
- [x] Evidencias de validacao foram registradas por criterio.
- [x] Requisitos nao funcionais foram tratados.
- [x] Riscos criticos possuem mitigacao explicita.
- [x] Decisoes tecnicas e trade-offs estao documentados.
- [x] Rollout/fallback/rollback esta definido.
- [x] Nao ha pendencias bloqueantes nao documentadas.
- [x] Resumo final inclui entregue, pendente e risco residual.

## 16) Pendencias e Riscos Residuais

- Entregue: remocao dos botoes/cartoes de atualizacao manual nas telas `componentes` e `escalas`, com limpeza de props/imports associados.
- Pendente: nao houve implementacao de SSE nova nesta tarefa.
- Risco residual: nao foi identificado fluxo de SSE explicito no repositorio durante a analise local; portanto, hoje a atualizacao continua garantida por recarregamento/hidratacao da pagina e por quaisquer sincronizacoes automaticas externas ao codigo analisado.
