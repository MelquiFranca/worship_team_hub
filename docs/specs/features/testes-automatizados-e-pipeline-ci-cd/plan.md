# Plano Tecnico - testes-automatizados-e-pipeline-ci-cd

## 1) Referencia da Spec

- Feature: testes-automatizados-e-pipeline-ci-cd
- Documento: `features/testes-automatizados-e-pipeline-ci-cd/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Adotar uma estrategia progressiva de qualidade para nao travar o time:

1. Definir baseline de testes obrigatorios para MVP e fluxo de execucao local.
2. Implantar CI em PR com gates essenciais.
3. Evoluir para CD por ambientes com aprovacao humana para producao.
4. Medir estabilidade/tempo de feedback e ajustar paralelismo/cache dos jobs.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Documentar estrategia minima de testes (escopo, responsabilidades, matriz de cenarios criticos). | AC-01 | Revisao tecnica | Documento de estrategia aprovado |
| T-02 | Estruturar testes iniciais (unitario/integracao/smoke) para fluxos criticos de MVP. | AC-01, AC-02 | Automatizado | Suites base executando localmente |
| T-03 | Padronizar scripts de testes no `package.json` e instrucoes de execucao local. | AC-02 | Manual + automatizado | Scripts `test*` e guia de uso |
| T-04 | Criar workflow de CI para PR com `lint`, `build` e testes automatizados como checks obrigatorios. | AC-03 | CI | Runs de PR com status pass/fail |
| T-05 | Criar workflow de CD por ambiente com gate de aprovacao para producao e procedimento de rollback. | AC-04 | Simulacao de release | Pipeline de deploy documentada |
| T-06 | Definir e habilitar publicacao de artefatos/logs de pipeline para rastreabilidade por commit. | AC-05 | CI/CD | Artefatos anexados aos runs |
| T-07 | Medir duracao da CI em ciclos consecutivos, definir SLO inicial e otimizar gargalos. | AC-06 | Observabilidade de pipeline | Relatorio de tempos e ajustes aplicados |

## 4) Ordem de Execucao

1. Baseline de testes e scripts locais (T-01, T-02, T-03).
2. CI em PR com quality gates (T-04).
3. CD por ambiente com aprovacao e rollback (T-05).
4. Rastreabilidade e otimzacao de performance da esteira (T-06, T-07).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Suites iniciais instaveis gerarem flakiness | Alto | Media | Comecar com cenarios deterministas e registrar quarantina de testes instaveis. |
| Tempo de CI elevado degradar produtividade | Medio | Alta | Paralelizar jobs, usar cache de dependencias e reduzir escopo inicial ao critico. |
| Falta de segredo/permissao para deploy automatizado | Alto | Media | Validar pre-requisitos de credenciais antes de habilitar CD em producao. |
| Pipeline sem politica de branch protection efetiva | Alto | Media | Configurar checks obrigatorios e bloqueio de merge sem CI verde. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de rollout:
  - Fase 1: habilitar CI apenas para PRs (observabilidade + gates).
  - Fase 2: habilitar CD automatico para staging apos CI verde.
  - Fase 3: habilitar CD para producao com aprovacao manual e janela controlada.
- Plano de fallback: manter deploy manual tradicional enquanto CD e estabilizada.
- Plano de rollback: desativar etapa automatica de deploy e retornar para promocao manual em caso de incidente.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-21 | Priorizar quality gate minimo (`lint`, `build`, testes criticos`) antes de ampliar cobertura | Reduzir risco de regressao de MVP com baixo overhead inicial | Base de confiabilidade para evolucao de testes |
| 2026-04-21 | Separar CI (validacao) de CD (promocao) com aprovacao manual em producao | Aumentar seguranca operacional no primeiro ciclo de go-live | Menor risco de deploy acidental |
| 2026-04-21 | Medir SLO de tempo da CI como criterio operacional do MVP | Evitar esteira lenta e improdutiva | Feedback rapido para desenvolvimento continuo |
