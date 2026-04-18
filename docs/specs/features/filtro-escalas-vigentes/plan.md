# Plano Tecnico - filtro-escalas-vigentes

## 1) Referencia da Spec

- Feature: filtro-escalas-vigentes
- Documento: `features/filtro-escalas-vigentes/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Implementar o filtro em duas camadas para garantir comportamento padrao consistente e flexibilidade para consulta historica:
1. Backend com `timeScope` validado e default em `current-and-future`.
2. Frontend com controle explicito do filtro para alternancia entre visao vigente e completa.
3. Ajustes de comunicacao visual no cabecalho para reduzir ambiguidade.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Atualizar `GET /api/scales` com parse de `timeScope`, validacao de valores permitidos, default em `current-and-future` e filtro por `date >= hoje`. | AC-01, AC-02, AC-03 | Integracao manual de API | `src/app/api/scales/route.js` |
| T-02 | Atualizar `ScalesPageClient` para manter estado de `timeScope` e requisitar escalas com query param correspondente. | AC-04, AC-05 | Integracao frontend | `src/app/escalas/ScalesPageClient.jsx` |
| T-03 | Atualizar `ScaleFeed` para exibir seletor de filtro, label acessivel e texto de comportamento padrao no header. | AC-05, AC-06 | UI manual + a11y basica | `src/components/organisms/ScaleFeed/ScaleFeed.jsx`, `ScaleFeed.module.css` |
| T-04 | Rodar validacao tecnica final e registrar evidencias da entrega. | AC-01 a AC-06 | Lint + revisao manual | `validation.md`, `evidence.md` |

## 4) Ordem de Execucao

1. Implementar filtro e validacao no endpoint de escalas.
2. Conectar estado de filtro no client e chamadas de dados.
3. Exibir controle visual de filtro no feed.
4. Executar validacoes e registrar evidencias.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Divergencia de "hoje" por timezone de execucao do servidor | Medio | Media | Documentar suposicao de timezone e expor `currentLocalIsoDate` na resposta para diagnostico. |
| Parametro invalido gerar comportamento silencioso | Alto | Baixa | Validar `timeScope` explicitamente e retornar `400 BAD_REQUEST`. |
| Regressao visual no header com novo seletor | Medio | Media | Ajustar CSS responsivo com `flex-wrap` e validar em desktop/mobile. |
| Quebra de acessibilidade no controle novo | Medio | Baixa | Incluir `label` associado ao `select` e estilo de `focus-visible`. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: usar `timeScope=all` no client para reproduzir comportamento legado de listar tudo.
- Plano de rollback: reverter alteracoes em `route.js`, `ScalesPageClient.jsx` e `ScaleFeed.*`.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-18 | Definir default do endpoint como `timeScope=current-and-future` | Garantir comportamento padrao consistente para todos os clientes | Escalas antigas deixam de aparecer por padrao |
| 2026-04-18 | Expor opcao `timeScope=all` ao frontend por seletor simples | Manter acesso a historico sem esconder dados definitivamente | Usuario escolhe entre visao operacional e completa |
| 2026-04-18 | Manter filtro primario no backend em vez de apenas client-side | Reduzir payload padrao e garantir regra centralizada | Melhor desempenho e menor risco de comportamento divergente |
