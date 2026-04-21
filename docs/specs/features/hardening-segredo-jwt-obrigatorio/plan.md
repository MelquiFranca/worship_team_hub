# Plano Tecnico - hardening-segredo-jwt-obrigatorio

## 1) Referencia da Spec

- Feature: hardening-segredo-jwt-obrigatorio
- Documento: `features/hardening-segredo-jwt-obrigatorio/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Eliminar qualquer segredo default no dominio de autenticacao e centralizar validacao obrigatoria de configuracao JWT no bootstrap e na camada de requisicao, com respostas de erro consistentes para misconfiguracao.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Definir contrato unico de configuracao JWT obrigatoria (envs aceitas e regras de presenca). | AC-01, AC-02 | Unitario | Testes do modulo de config |
| T-02 | Remover fallback hardcoded de segredo em servico de emissao/validacao JWT. | AC-01 | Unitario | Diff + teste de regressao |
| T-03 | Implementar fail-fast no boot e guarda defensiva em runtime para ambiente misconfigurado. | AC-02, AC-03 | Integracao | Teste de inicializacao e API |
| T-04 | Padronizar resposta `503 AUTH_CONFIG_MISSING` em endpoints de auth quando aplicavel. | AC-03, AC-05 | Integracao | Contrato de erro |
| T-05 | Atualizar `.env.example` com variaveis JWT obrigatorias e exemplos nao sensiveis. | AC-04 | Manual | Diff do arquivo |
| T-06 | Instrumentar log estruturado de misconfiguracao sem dados sensiveis. | AC-05 | Unitario/Integracao | Saida de log validada |

## 4) Ordem de Execucao

1. Formalizar contrato de configuracao (T-01).
2. Remover fallback inseguro (T-02).
3. Aplicar fail-fast e contrato de erro (T-03, T-04).
4. Atualizar documentacao de ambiente e observabilidade (T-05, T-06).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Quebra de ambientes locais sem env configurada | Medio | Alta | Mensagem de erro clara + documentacao minima no `.env.example`. |
| Regressao em fluxo de login por validacao agressiva | Alto | Media | Cobertura de integracao em login/refresh com env valida e invalida. |
| Vazamento acidental de segredo em logs de erro | Alto | Baixa | Sanitizacao obrigatoria e revisao de logger em teste. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: corrigir env de deploy e redeploy; nao reintroduzir fallback hardcoded.
- Plano de rollback: reverter alteracao apenas se bloquear operacao, mantendo segredo obrigatorio via patch emergencial equivalente.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressions criticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-21 | Segredo JWT passa a ser estritamente obrigatorio sem fallback | Eliminar superficie de ataque por segredo conhecido | Aumenta seguranca e exige disciplina de configuracao |
| 2026-04-21 | Misconfiguracao de auth responde com contrato explicito (`503`) | Facilitar diagnostico operacional | Melhora observabilidade e runbook de operacao |
