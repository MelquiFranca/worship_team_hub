# Plano Tecnico - edicao-exclusao-escalas

## 1) Referencia da Spec

- Feature: edicao-exclusao-escalas
- Documento: `features/edicao-exclusao-escalas/spec.md`
- Versao da spec: v1
- Data de contexto: 2026-04-15

## 2) Estrategia de Implementacao

Implementar por incrementos curtos reaproveitando estrutura existente de listagem e formulario: primeiro habilitar navegacao para modo edicao, depois carregar e salvar dados, em seguida incluir exclusao com confirmacao e por fim fechar autorizacao por audiencia e tratamento de erro com feedback consistente.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Adaptar card da listagem para abrir `Editar escala` com rota e identificador da escala selecionada. | AC-01 | Integracao + manual | Arquivo do card/rota + evidencia de navegacao |
| T-02 | Habilitar formulario de escalas em modo edicao, com leitura da escala alvo e pre-preenchimento de campos. | AC-01, AC-02 | Integracao | Teste de carregamento de dados em modo edicao |
| T-03 | Implementar submit de atualizacao no modo edicao com validacoes e preservacao de estado em caso de falha. | AC-02, AC-03, AC-08 | Integracao | Evidencia de sucesso e falha de update |
| T-04 | Aplicar regras de permissao por audiencia para exibir/ocultar acoes de edicao e exclusao (`group-app` permitido; `component-app` bloqueado). | AC-04, AC-07 | Integracao + autorizacao | Evidencia de comportamento por perfil |
| T-05 | Implementar acao de exclusao no formulario com etapa obrigatoria de confirmacao antes da remocao definitiva. | AC-05, AC-06, AC-08 | Manual + integracao | Evidencia do dialogo e confirmacao |
| T-06 | Garantir sincronizacao da listagem apos update/delete com feedback claro de sucesso/erro ao usuario. | AC-03, AC-06, AC-08 | Integracao + manual | Evidencia de listagem atualizada e mensagens |
| T-07 | Reforcar bloqueio server-side para operacoes proibidas a `component-app` e padronizar resposta `403` quando aplicavel. | AC-07 | Integracao de API/autorizacao | Logs/testes de acesso negado |
| T-08 | Consolidar validacao final, revisar rastreabilidade AC x tarefas e registrar evidencias da entrega. | AC-01 a AC-08 | Manual | Atualizacao de `validation.md` e `evidence.md` |

## 4) Ordem de Execucao

1. Implementar navegacao da listagem para modo edicao (T-01).
2. Adaptar formulario para carregar dados existentes e salvar atualizacao (T-02, T-03).
3. Aplicar permissao por audiencia no front e backend (T-04, T-07).
4. Implementar exclusao com confirmacao obrigatoria (T-05).
5. Ajustar feedback e consistencia de listagem apos update/delete (T-06).
6. Fechar validacao e evidencias (T-08).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Reutilizacao do formulario gerar regressao no modo de criacao | Alto | Media | Isolar logica por modo (`create`/`edit`) e cobrir com testes de regressao. |
| Exclusao sem confirmacao robusta causar perda acidental de dados | Alto | Baixa | Tornar confirmacao obrigatoria com CTA explicito e estado de cancelamento seguro. |
| Atualizacao da listagem apos operacao ficar inconsistente (stale data) | Alto | Media | Invalidar/recarregar fonte de dados apos sucesso e validar fluxo ponta a ponta. |
| Permissao apenas no frontend permitir bypass por chamada direta | Alto | Media | Garantir validacao server-side e retorno `403` para audiencia sem acesso. |
| Feedback de erro pouco claro aumentar retrabalho do usuario | Medio | Media | Padronizar mensagens acionaveis com orientacao de nova tentativa. |

## 6) Estrategia de Rollout

- Feature flag: Recomendado
- Migracao necessaria: Nao
- Plano de fallback: manter acesso apenas ao fluxo atual sem acao de editar/excluir ate homologacao completa.
- Plano de rollback: reverter alteracoes de rota/formulario de modo edicao e endpoint de delete mantendo cadastro/listagem atuais.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-15 | Reaproveitar o formulario de cadastro em modo edicao | Reduzir duplicacao de tela e manter consistencia de UX | Menor custo de manutencao e menor risco visual |
| 2026-04-15 | Tratar exclusao somente dentro do modo edicao com confirmacao explicita | Evitar exclusao acidental no card da listagem | Mais seguranca operacional para usuario final |
| 2026-04-15 | Exigir autorizacao por audiencia tambem no backend | Evitar bypass de UI por chamada direta | Maior seguranca e consistencia de regra |
