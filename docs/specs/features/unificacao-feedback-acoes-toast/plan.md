# Plano Tecnico - unificacao-feedback-acoes-toast

## 1) Referencia da Spec

- Feature: unificacao-feedback-acoes-toast
- Documento: `features/unificacao-feedback-acoes-toast/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Centralizar o feedback de sucesso/erro de acoes persistentes em um canal unico de toast global, integrado no layout pos-login e consumido pelos formularios do escopo via dispatcher compartilhado. A entrega sera incremental para reduzir risco de regressao visual e comportamental, com foco em validacoes manuais guiadas por criterio de aceite e cobertura minima de comportamento do ciclo de vida do toast (abertura, troca de evento, fechamento manual e autoclose).

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Estruturar provider/hook + host de toast global com estados de severidade, autoclose em 5s, fechamento manual e reset de timer em novo evento. | AC-02, AC-03 | Unitario + Manual | `validation.md` (pendente) |
| T-02 | Integrar disparo unificado nos fluxos de salvar/editar/excluir/inativar/salvar-status definidos no escopo, cobrindo sucesso e erro de API. | AC-01, AC-02 | Integracao + Manual | `validation.md` (pendente) |
| T-03 | Remover feedbacks locais duplicados de resultado de acao nos formularios refatorados, preservando mensagens inline de campo. | AC-01, AC-04 | Manual | `validation.md` (pendente) |
| T-04 | Validar comportamento responsivo do toast nas telas afetadas (mobile/desktop), incluindo convivo com nav inferior e prompt de notificacao. | AC-05 | Manual responsivo | `validation.md` (pendente) |
| T-05 | Executar checklist final de acessibilidade e regressao visual/funcional nas rotas impactadas e consolidar evidencias por AC. | AC-03, AC-04, AC-05 | Manual + Inspecao DOM | `validation.md` (pendente) |

## 4) Ordem de Execucao

1. Executar T-01 para disponibilizar infraestrutura global e comportamento base do toast.
2. Executar T-02 para conectar os fluxos de acao persistente ao dispatcher unificado.
3. Executar T-03 para eliminar duplicidade de feedback sem perder erros inline.
4. Executar T-04 para validar responsividade e convivio com elementos fixos da UI.
5. Executar T-05 para fechamento de qualidade e consolidacao de evidencias por criterio.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Toast sobrepor elementos fixos (nav inferior/prompt) em viewport reduzida | Alto | Media | Definir area segura e validar em breakpoints alvo durante T-04. |
| Perda de mensagens de erro inline ao remover feedback local | Alto | Media | Remocao controlada por formulario com checklist de validacao por fluxo em T-03/T-05. |
| Eventos sequenciais sobrescreverem feedback sem leitura minima | Medio | Media | Reiniciar timer e garantir visibilidade clara do ultimo evento; validar sequencia manual em T-01/T-05. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: manter possibilidade de reativar mensagens locais em formularios criticos se houver regressao bloqueante.
- Plano de rollback: reverter integracoes de dispatcher nos formularios impactados e remover host global caso necessario.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressos criticos

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-05-01 | Unificar feedback de acoes persistentes em toast global pos-login | Resolver baixa visibilidade de retorno em formularios longos, principalmente no mobile | Maior consistencia de UX e simplificacao de manutencao de feedbacks |
| 2026-05-01 | Priorizar validacao manual guiada por AC na fase inicial | Escopo cruza multiplos formularios e estados de UI | Evidencia inicial rapida; testes automatizados podem ser ampliados depois |
