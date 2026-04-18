# Plano Tecnico - notificacao-push-escalas

## 1) Referencia da Spec

- Feature: notificacao-push-escalas
- Documento: `features/notificacao-push-escalas/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Implementar em camadas para reduzir regressao no fluxo atual:

1. Criar servico de notificacao push com builder de payload e resultado estruturado.
2. Integrar disparo automatico no `POST /api/scales` sem quebrar sucesso de criacao.
3. Criar endpoint dedicado de reenvio manual por escala com autorizacao server-side.
4. Integrar botao `Notificacao` no `ScaleFeed` com chamada real de API e feedback de UX.
5. Unificar regra de permissao na UI para usar matriz de permissoes existente (`canNotifyScale`) e manter bloqueio para `component-app`.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Implementar servico de notificacao push (resolver destinatarios, montar payload e disparar envio) | AC-08 | Unitario + Integracao | Testes do builder e contrato de envio |
| T-02 | Resolver destinatarios da escala a partir de `components[]` e origem de tokens/subscriptions | AC-02 | Integracao | Evidencia de lista de destinatarios por escala |
| T-03 | Integrar disparo automatico no fluxo de criacao de escala (`POST /api/scales`) com tolerancia a falha | AC-01, AC-03, AC-09 | Integracao | Teste de criacao com push sucesso/falha |
| T-04 | Criar endpoint `POST /api/scales/[scaleId]/notify` com validacoes de existencia da escala e autorizacao por audiencia | AC-04, AC-06, AC-07, AC-09 | Integracao | Testes `200/403/404` |
| T-05 | Atualizar `ScaleFeed` para o botao `Notificacao` chamar endpoint real e mostrar feedback de carregamento/sucesso/erro | AC-05, AC-06 | Integracao UI + Manual | Capturas e fluxo do botao |
| T-06 | Alinhar regra de permissao no frontend para usar `permissions.canNotifyScale` e manter comportamento consistente para `component-app` | AC-06 | Unitario/UI | Evidencia de render por perfil |
| T-07 | Padronizar logs e resposta tecnica de envio (automatico/manual) com contadores de enviados/falhas | AC-03, AC-09 | Integracao | Logs estruturados e payload de resposta |
| T-08 | Executar validacao final (`lint`, `build`, testes da feature) e atualizar `validation.md` e `evidence.md` | AC-01 a AC-09 | Manual + Integracao | Documentos de validacao atualizados |

## 4) Ordem de Execucao

1. Base de servico/payload e destinatarios (T-01, T-02).
2. Disparo automatico na criacao da escala (T-03).
3. Endpoint de reenvio com autorizacao (T-04).
4. Integracao do botao `Notificacao` e permissao frontend (T-05, T-06).
5. Observabilidade e consolidacao de testes/evidencias (T-07, T-08).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Ausencia/inconsistencia de tokens de push para componentes | Alto | Media | Tratar destinatario sem token como nao elegivel; registrar parcial sem falhar criacao da escala. |
| Divergencia entre bloqueio de UI e bloqueio server-side | Alto | Media | Garantir validacao obrigatoria no endpoint + testes por audiencia. |
| Falha do provedor de push degradar criacao da escala | Alto | Media | Isolar envio em bloco tolerante a falha e preservar sucesso da persistencia da escala. |
| Reenvio manual gerar feedback ambiguo no frontend | Medio | Media | Retornar resultado estruturado (enviados/falhas) e padronizar mensagens ao usuario. |
| Regressao no fluxo atual do `ScaleFeed` | Medio | Baixa | Entrega incremental com testes de interacao e validacao manual focada na acao de notificar. |

## 6) Estrategia de Rollout

- Feature flag: Recomendado (`PUSH_SCALE_NOTIFY_V1`).
- Migracao necessaria: Dependente da origem dos tokens de push; sem migracao se ja existir fonte de destino.
- Plano de fallback: desativar flag e manter botao `Notificacao` sem chamada efetiva enquanto corrige regressao.
- Plano de rollback: reverter alteracoes de endpoint e integracao da UI da feature.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-18 | Envio automatico ocorre logo apos persistencia da escala e nao bloqueia sucesso do cadastro em caso de falha de push | Priorizar confiabilidade do fluxo principal de negocio (escala criada) | Reduz risco operacional de perda do cadastro |
| 2026-04-18 | Reenvio manual em endpoint dedicado por escala (`/api/scales/[scaleId]/notify`) | Separar responsabilidade de notificacao do endpoint de CRUD | Melhora manutenibilidade e observabilidade |
| 2026-04-18 | Bloqueio de notificacao para `component-app` aplicado em UI e backend | Defesa em profundidade e consistencia de autorizacao | Evita bypass via chamada direta |
