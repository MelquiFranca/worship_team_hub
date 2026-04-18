# Plano Tecnico - edicao-inativacao-componentes

## 1) Referencia da Spec

- Feature: edicao-inativacao-componentes
- Documento: `features/edicao-inativacao-componentes/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Executar em incrementos orientados por permissao e fluxo do usuario: primeiro fechar regra de clique/autorizacao no card, depois habilitar modo edicao no formulario, em seguida incluir acao de inativacao com persistencia, e por fim consolidar listagem com estado visual e filtros de ativos/inativos.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Definir matriz de autorizacao para interacao do card e acesso a rota de edicao (`group-app` permitido, demais bloqueados). | AC-01, AC-05 | Revisao tecnica + teste manual por perfil | Atualizacao em `spec.md` + checklist de perfis |
| T-02 | Implementar estado clicavel do card apenas para `group-app`, com feedback visual de bloqueio para nao autorizados. | AC-01, AC-05 | Teste de componente + manual | Capturas de tela por perfil |
| T-03 | Implementar redirecionamento para formulario em modo edicao com carregamento do componente por id e submit de update. | AC-02, AC-03 | Integracao frontend + API | Log de teste de navegacao e payload de update |
| T-04 | Implementar persistencia de edicao e acao de inativacao no backend, com validacao de permissao em servidor. | AC-03, AC-04 | Integracao backend | Testes de update/inativacao com autorizacao e negacao |
| T-05 | Atualizar listagem para refletir status inativo apos inativacao e aplicar estado visual por item. | AC-04, AC-06 | Integracao frontend + manual | Evidencia visual da lista antes/depois |
| T-06 | Implementar UX de bloqueio completo para acesso nao autorizado (card, rota direta e acoes de edicao). | AC-05, AC-06 | Manual + integracao | Logs/capturas de bloqueio e resposta `403` |
| T-07 | Implementar filtros de listagem (ativos, inativos, todos) e validar consistencia de contagem e exibicao. | AC-06 | Integracao frontend + regressao manual | Registro de cenarios de filtro |
| T-08 | Consolidar regressao funcional do fluxo completo e atualizar validacao/evidencias da feature. | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06 | Regressao manual + checklist | `validation.md` e `evidence.md` atualizados |

## 4) Ordem de Execucao

1. Fechar regra de permissao e estados de interacao (T-01, T-02).
2. Entregar entrada no modo edicao e persistencia de alteracoes (T-03, T-04).
3. Concluir fluxo de inativacao e reflexo em listagem (T-05).
4. Cobrir bloqueios de acesso nao autorizado ponta a ponta (T-06).
5. Finalizar filtros e regressao completa com evidencias (T-07, T-08).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Card aparentar clicavel para perfil sem permissao por falha de condicao de UI | Alto | Media | Centralizar regra de permissao e cobrir com teste de componente por perfil. |
| Usuario contornar bloqueio de UI via URL direta | Alto | Media | Validar autorizacao tambem no backend e na protecao de rota. |
| Inativacao quebrar fluxo existente de cadastro/edicao | Medio | Media | Isolar modo edicao por id e manter contrato de cadastro sem alteracoes breaking. |
| Filtros da listagem exibirem contagens inconsistentes apos update/inativacao | Medio | Media | Recalcular estado da lista apos mutacao e cobrir com teste de integracao dos filtros. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: manter cards sem acao de edicao para todos os perfis ate estabilizar autorizacao e persistencia.
- Plano de rollback: reverter fluxo de modo edicao/inativacao mantendo listagem somente de visualizacao.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-15 | Permitir clique de card somente para `group-app` | Reduzir tentativa de acao invalida e alinhar autorizacao de negocio | UX previsivel e menos erro de acesso |
| 2026-04-15 | Reutilizar formulario de componentes com estado explicito de modo edicao | Evitar duplicacao de tela e reduzir custo de manutencao | Menor esforco de desenvolvimento com fluxo consistente |
| 2026-04-15 | Implementar inativacao logica por status em vez de exclusao fisica | Preservar historico e evitar perda de referencia em listagens | Melhor rastreabilidade e menor risco de regressao |
