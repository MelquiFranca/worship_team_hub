# Plano Tecnico - middleware-validacao-assinatura-jwt-obrigatoria

## 1) Referencia da Spec

- Feature: middleware-validacao-assinatura-jwt-obrigatoria
- Documento: `features/middleware-validacao-assinatura-jwt-obrigatoria/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Reestruturar o middleware para fail-closed: sem chave valida nao ha autorizacao. A verificacao de assinatura e claims essenciais ocorre antes de qualquer decisao de acesso, com contrato de erro consistente.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Consolidar funcao unica de validacao JWT no middleware com verificacao obrigatoria de assinatura e claims. | AC-01, AC-04 | Unitario/Integracao | Testes de middleware |
| T-02 | Remover bypass permissivo em ausencia de segredo/chaves e aplicar comportamento fail-closed. | AC-01, AC-02 | Integracao | Diff + teste de regressao |
| T-03 | Padronizar respostas de erro (`401` token invalido, `503` misconfiguracao). | AC-02, AC-03 | Contrato/Integracao | Testes de contrato HTTP |
| T-04 | Ajustar logs tecnicos para eventos de assinatura/expiracao/misconfig sem dados sensiveis. | AC-03, AC-04 | Unitario | Saida de logs validada |
| T-05 | Criar suite automatizada cobrindo cenarios de bypass historico e matriz de tokens invalidos. | AC-05 | Integracao | Relatorio de testes |

## 4) Ordem de Execucao

1. Implementar validacao obrigatoria central no middleware (T-01).
2. Eliminar bypass e definir fail-closed (T-02).
3. Padronizar contratos de erro e logs (T-03, T-04).
4. Consolidar cobertura automatizada e evidencias (T-05).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Rejeicao indevida de tokens validos apos endurecimento | Alto | Media | Matriz de testes com tokens reais de homologacao. |
| Divergencia de codigos de erro entre rotas | Medio | Media | Contrato unico de erro no middleware e testes de contrato. |
| Queda de disponibilidade por config ausente | Medio | Alta | Runbook de configuracao e alerta antecipado em deploy. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: corrigir configuracao de chave no ambiente; manter middleware fail-closed.
- Plano de rollback: rollback apenas para versao anterior segura equivalente, sem reintroduzir bypass permissivo.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressions criticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-21 | Middleware adota politica fail-closed sem excecao | Eliminar autenticacao sem prova criptografica | Reduz risco de acesso indevido |
| 2026-04-21 | Misconfiguracao de chave retorna `503` especifico | Facilitar diagnostico operacional | Separa erro de config de erro de credencial |
