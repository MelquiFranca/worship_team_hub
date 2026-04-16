# Plano Tecnico - permissao-tipo-cadastro-componentes

## 1) Referencia da Spec

- Feature: permissao-tipo-cadastro-componentes
- Documento: `features/permissao-tipo-cadastro-componentes/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Implementar em incrementos curtos: primeiro fechar contrato de enum e fallback retroativo, depois evoluir UI e validacoes do formulario, em seguida ajustar backend/persistencia/respostas e finalizar com testes de compatibilidade e validacao final.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Definir contrato canonico de `permissionType` (enum, nome de campo, fallback legado) e alinhar com frontend/backend. | AC-01, AC-05 | Revisao tecnica | `spec.md`, ADR curta ou anotacao no PR |
| T-02 | Adicionar campo "tipo de permissao" na UI de cadastro com opcoes fixas do enum. | AC-01, AC-02 | Manual + integracao frontend | Captura da tela + teste de render |
| T-03 | Atualizar validacao e submit do formulario para enviar `permissionType` no payload. | AC-02 | Integracao frontend | Teste de submit com payload esperado |
| T-04 | Atualizar validacao da API para aceitar apenas enum e retornar `400` para invalido/ausente. | AC-03 | Integracao backend | Testes de rota com matriz valido/invalido |
| T-05 | Persistir `permissionType` em `components` e incluir campo nas respostas de criacao/listagem. | AC-04, AC-05 | Integracao backend + banco | Registro salvo + contrato de resposta |
| T-06 | Implementar camada de compatibilidade retroativa para componentes antigos sem campo. | AC-05, AC-06 | Integracao backend | Testes com fixtures legadas |
| T-07 | Executar regressao funcional de cadastro/listagem e consolidar validacao/evidencias da feature. | AC-06 | Manual + regressao | `validation.md` e `evidence.md` atualizados |

## 4) Ordem de Execucao

1. Fechar contrato e fallback retroativo (T-01).
2. Evoluir UI e submit do formulario (T-02, T-03).
3. Ajustar validacao e persistencia no backend (T-04, T-05).
4. Garantir compatibilidade com legados (T-06).
5. Rodar regressao e consolidar evidencias (T-07).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Divergencia de enum entre frontend e backend | Alto | Media | Centralizar constantes compartilhadas ou contrato unico documentado em T-01. |
| Quebra de leitura para dados antigos sem campo | Alto | Media | Aplicar fallback explicito e cobrir com testes de fixture legado em T-06. |
| Mudanca de contrato impactar consumidores existentes | Medio | Baixa | Tornar `permissionType` retrocompativel na resposta e validar consumidores atuais. |
| Regressao no fluxo de cadastro atual | Medio | Media | Executar regressao manual guiada e testes de integracao antes de liberar. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao (backfill opcional posterior)
- Plano de fallback: manter fallback `component-app` para registros sem campo e permitir rollback do campo na UI sem quebrar leitura.
- Plano de rollback: reverter alteracoes de formulario e validacao de API mantendo comportamento anterior.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-15 | Adotar `permissionType` como nome canonico de campo | Padronizar contrato entre UI, API e banco | Reduz ambiguidade na implementacao |
| 2026-04-15 | Definir enum inicial `admin-panel`, `group-app`, `component-app` | Reutilizar audiencias ja existentes no sistema | Simplifica validacao e autorizacao futura |
| 2026-04-15 | Aplicar fallback `component-app` para dados legados sem campo | Garantir compatibilidade retroativa sem migracao bloqueante | Evita quebra de leitura em producao |
