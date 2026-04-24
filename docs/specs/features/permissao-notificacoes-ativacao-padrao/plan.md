# Plano Tecnico - permissao-notificacoes-ativacao-padrao

## 1) Referencia da Spec

- Feature: permissao-notificacoes-ativacao-padrao
- Documento: `features/permissao-notificacoes-ativacao-padrao/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Separar o fluxo de notificacao em duas etapas: descoberta/solicitacao de permissao e ativacao tecnica da subscription. A autenticacao de `component-app` passa a expor estado de push no contexto e oferece acao explicita para solicitar permissao, enquanto a ativacao tecnica continua automatica quando a permissao ja estiver concedida.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Evoluir `registerClientPushSubscription` para suportar tentativa silenciosa (sem prompt) e tentativa com prompt explicito, retornando razoes tecnicas para controle de retry. | AC-02, AC-03, AC-04, AC-05 | Manual + Unitario (regras puras) | Codigo atualizado + execucao de testes unitarios |
| T-02 | Atualizar `AuthSessionContext` para expor estado de push (`permission`, `supported`, `isRegistering`, `lastReason`) e orquestrar ativacao automatica/retry controlado para `component-app`. | AC-01, AC-02, AC-03, AC-04, AC-05 | Manual | Fluxo em sessao autenticada com comportamento esperado |
| T-03 | Criar componente de UI (molecule) para solicitar permissao de notificacoes ao usuario quando `permission=default`, com acessibilidade e feedback. | AC-01, AC-02 | Manual | CTA visivel, acionavel por teclado, com mensagem de retorno |
| T-04 | Validar cenarios de falha/negacao/sucesso e registrar evidencias em `validation.md`. | AC-04, AC-05 | Manual + Lint | Relatorio final de validacao |

## 4) Ordem de Execucao

1. Evoluir servico de registro push para separar solicitacao de permissao e ativacao tecnica (T-01).
2. Atualizar contexto de sessao para estado e orquestracao de ativacao/retry (T-02).
3. Implementar CTA de permissao na UI para componente autenticado (T-03).
4. Executar validacoes e consolidar evidencias (T-04).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Prompt de permissao nao aparecer sem gesto de usuario | Alto | Media | Fornecer CTA explicito para acionar o pedido de permissao via clique. |
| Loop de tentativas de subscribe gerar ruido de rede | Medio | Media | Implementar retry controlado com atraso fixo e condicoes de parada por motivo terminal. |
| Regressao no fluxo de autenticacao | Alto | Baixa | Isolar falhas de push para nunca interromper sessao e executar validacao manual de login. |

## 6) Estrategia de Rollout

- Feature flag: Nao.
- Migracao necessaria: Nao.
- Plano de fallback: remover CTA e manter apenas tentativa silenciosa atual caso haja regressao visual.
- Plano de rollback: reverter alteracoes do contexto e do servico de subscription.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-24 | Separar tentativa silenciosa (auto) de tentativa com prompt (acao explicita). | Compatibilidade com politicas de permissao dos navegadores e melhor UX. | Aumenta chance real de opt-in sem quebrar ativacao automatica quando ja permitido. |
| 2026-04-24 | Exibir CTA global para `component-app` apenas quando permissao estiver `default`. | Solicitar permissao de forma clara, sem atrapalhar fluxos administrativos. | Fluxo de notificacao fica previsivel para quem realmente recebe push. |
