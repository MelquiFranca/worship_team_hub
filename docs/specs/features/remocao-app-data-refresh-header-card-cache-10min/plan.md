# Plano Tecnico - remocao-app-data-refresh-header-card-cache-10min

## 1) Referencia da Spec

- Feature: remocao-app-data-refresh-header-card-cache-10min
- Documento: `features/remocao-app-data-refresh-header-card-cache-10min/plan.md`
- Versao da spec: v1

## 2) Escopo

- Remover o uso de `AppDataRefreshHeaderCard` das telas que ainda exibem o card de atualizacao manual.
- Fazer o recarregamento normal da pagina reaproveitar o snapshot local de dados do app quando ele tiver menos de 10 minutos e pertencer a sessao atual.
- Refazer a hidratacao remota quando o snapshot local estiver ausente, invalido, em erro, fora do namespace da sessao ou expirado.
- Manter fluxos manuais existentes que usam `AppDataRefreshButton` diretamente.

## 3) Nao-Escopo

- Remover `AppDataRefreshButton`.
- Migrar a hidratacao para Server Components ou usar `next.revalidate`.
- Alterar contratos das rotas de API ou introduzir cache compartilhado de respostas autenticadas.
- Mudar fluxos de edicao/cadastro de componentes, escalas, perfil ou indisponibilidade.

## 4) Criterios de Aceite

| ID | Criterio |
| --- | --- |
| AC-01 | Nenhuma tela renderiza ou importa `AppDataRefreshHeaderCard`. |
| AC-02 | Recarregar a pagina usa o snapshot local quando ele tem menos de 10 minutos e pertence ao namespace da sessao atual. |
| AC-03 | Recarregar a pagina refaz as chamadas remotas quando o cache tem 10 minutos ou mais, esta ausente, invalido ou em erro. |
| AC-04 | Fluxos manuais ainda existentes com `AppDataRefreshButton` continuam funcionando. |
| AC-05 | O plano documenta evidencias por AC e passa no checklist de revisao. |

## 5) Estrategia de Implementacao

Aplicar a remocao visual nas composicoes de `componentes` e `escalas`, limpando props/imports mortos. No cache compartilhado do app, criar uma regra pura de frescor com TTL de 10 minutos e usa-la no `AppDataCacheContext` para decidir se a hidratacao remota deve rodar durante o carregamento da pagina. As chamadas remotas da hidratacao deixam de forcar `cache: 'no-store'`, mas `refreshAppData` segue fazendo fetch remoto imediato para os botoes restantes.

## 6) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Criar helper puro para validade do snapshot com TTL de 10 minutos e cobrir cenarios de cache fresco/expirado/invalido. | AC-02, AC-03 | Unitario | `tests/unit/app-data-cache-freshness.test.mjs` |
| T-02 | Integrar a regra de TTL no `AppDataCacheContext`, removendo `cache: 'no-store'` das chamadas de hidratacao e preservando refresh manual remoto. | AC-02, AC-03, AC-04 | Unitario + revisao | Diff em `src/context/AppDataCacheContext.jsx` |
| T-03 | Remover `AppDataRefreshHeaderCard` de `componentes`, limpando destructuring e importacoes mortos. | AC-01 | Revisao + busca | Diff em `src/app/componentes/ComponentsPageClient.jsx` |
| T-04 | Remover `AppDataRefreshHeaderCard` de `escalas`, limpando props `onRefresh/isRefreshing` no page client e no organism. | AC-01 | Revisao + busca | Diff em `src/app/escalas/ScalesPageClient.jsx` e `src/components/organisms/ScaleFeed/ScaleFeed.jsx` |
| T-05 | Executar validacoes, revisar checklist e registrar evidencias/pedencias/riscos no plano. | AC-01, AC-02, AC-03, AC-04, AC-05 | Busca + testes | Secoes 12, 15 e 16 deste plano |

## 7) Ordem de Execucao

1. Registrar spec/plano com criterios, tarefas e rastreabilidade.
2. Implementar helper e teste unitario de TTL.
3. Integrar TTL no contexto de cache do app.
4. Remover o card manual das telas `componentes` e `escalas`.
5. Executar validacoes e preencher evidencias finais.

## 8) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Dados ficarem obsoletos por ate 10 minutos apos edicao externa | Medio | Media | TTL limitado a 10 minutos e `refreshAppData` manual preservado para telas que ainda o usam. |
| Snapshot de outra sessao ser reutilizado indevidamente | Alto | Baixa | Manter validacao por namespace antes de considerar o cache fresco. |
| Remocao do card deixar props/imports mortos | Medio | Baixa | Limpar cadeia de props e validar com busca local. |
| Teste de provider React ser pesado no ambiente atual | Baixo | Media | Testar helper puro de TTL e registrar revisao estatica da integracao. |

## 9) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: reduzir o TTL para 0 no helper e restaurar a hidratacao remota em todo carregamento.
- Plano de rollback: reverter o commit da feature.

## 10) Rastreabilidade AC -> Tarefas

- AC-01 -> T-03, T-04, T-05
- AC-02 -> T-01, T-02, T-05
- AC-03 -> T-01, T-02, T-05
- AC-04 -> T-02, T-05
- AC-05 -> T-05

## 11) Estrategia de Testes

- Teste unitario do helper de frescor do cache cobrindo snapshot fresco, expirado, erro, namespace divergente, timestamp invalido e ausencia de sync.
- Busca local por `AppDataRefreshHeaderCard` em `src`.
- Execucao de teste unitario direcionado e, se viavel, suite completa `npm test`.
- Revisao estatica de consumidores restantes de `refreshAppData` para confirmar preservacao de `AppDataRefreshButton`.

## 12) Evidencias por Criterio de Aceite

| AC | Status | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | `rg -n "AppDataRefreshHeaderCard" src` sem resultados; `src/app/componentes/ComponentsPageClient.jsx:1-63`; `src/app/escalas/ScalesPageClient.jsx:37-58`; `src/components/organisms/ScaleFeed/ScaleFeed.jsx:2089-2099` e `2260-2272` | O card foi removido das telas e os arquivos do molecule morto foram excluidos. |
| AC-02 | Pass | `src/context/appDataCacheFreshness.js:1-29`; `src/context/AppDataCacheContext.jsx:435-441`; `tests/unit/app-data-cache-freshness.test.mjs:23-25` | Snapshot com namespace atual, status `success` e idade menor que 10 minutos encerra a hidratacao sem fetch remoto. |
| AC-03 | Pass | `src/context/appDataCacheFreshness.js:18-28`; `src/context/AppDataCacheContext.jsx:443-465`; `tests/unit/app-data-cache-freshness.test.mjs:27-53` | Cache no limite de 10 minutos, expirado, em erro, com namespace divergente ou timestamp invalido nao e aceito e segue para hidratacao remota. |
| AC-04 | Pass | `src/context/AppDataCacheContext.jsx:388-417` e `481-507`; `src/app/editar-perfil/page.js:315`; `src/components/organisms/ComponentUnavailabilityForm/ComponentUnavailabilityForm.jsx:319`; `npm test` | `refreshAppData` continua exposto e usa fetch remoto com `cache: 'no-store'` para botoes compactos existentes. |
| AC-05 | Pass | Este `plan.md`; `npm test` | Evidencias registradas e checklist revisado. |

## 13) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressoes criticas

## 14) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-07-12 | Usar TTL client-side em vez de `next.revalidate` | A hidratacao atual roda em Client Components via browser `fetch`; `next.revalidate` exigiria refatoracao maior para server-side | Entrega menor e alinhada ao fluxo atual, sem cache compartilhado de dados autenticados. |
| 2026-07-12 | Preservar `refreshAppData` e `AppDataRefreshButton` | Ainda existem telas que usam botao manual compacto | Evita regressao fora do escopo. |

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

- Entregue: removido `AppDataRefreshHeaderCard` de `componentes` e `escalas`, excluidos os arquivos do molecule morto, adicionado TTL client-side de 10 minutos para a hidratacao automatica e preservado `refreshAppData` para botoes compactos existentes.
- Pendente: nenhum bloqueante identificado.
- Risco residual: dados podem permanecer ate 10 minutos sem buscar remoto ao recarregar a pagina quando houver snapshot local fresco; esta e a politica esperada desta tarefa.

## 17) Validacoes Executadas

- `rg -n "AppDataRefreshHeaderCard" src` -> sem resultados.
- `node --test --experimental-default-type=module tests/unit/app-data-cache-freshness.test.mjs` -> 4 testes passaram.
- `npm run test:unit` -> 64 testes passaram.
- `npm test` -> unitarios, integracao e smoke passaram.
