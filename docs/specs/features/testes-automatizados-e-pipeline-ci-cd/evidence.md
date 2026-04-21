# Evidencias - testes-automatizados-e-pipeline-ci-cd

## Checklist de evidencias tecnicas

- [x] Documento de estrategia de testes MVP publicado com escopo e responsabilidades.
- [x] Suites iniciais de testes unitarios/integracao/smoke implementadas para fluxos criticos.
- [x] Scripts padronizados de teste adicionados no `package.json` (`test`, `test:unit`, `test:integration`, etc.).
- [x] Workflow de CI em PR criado com gates obrigatorios (`lint`, `build`, testes`).
- [x] Workflow de CD por ambiente criado com aprovacao manual para producao.
- [x] Procedimento de rollback documentado e validado em simulacao.
- [x] Publicacao de artefatos/logs habilitada para rastreio por commit/release.
- [ ] SLO inicial de tempo da CI definido com medicao historica.

## Checklist de evidencias funcionais

- [ ] PR com alteracao proposital invalida e bloqueado por CI.
- [ ] PR com alteracao valida aprovado com todos os checks verdes.
- [ ] Execucao de release para staging concluida com sucesso.
- [ ] Execucao controlada de release para producao com aprovacao manual registrada.
- [ ] Teste de rollback executado em ambiente nao produtivo com resultado documentado.

## Matriz de cenarios de validacao (planejada)

| Cenario | Pre-condicao | Resultado esperado | AC relacionado |
| --- | --- | --- | --- |
| C-01 | PR com erro de lint | CI falha e merge bloqueado | AC-03 |
| C-02 | PR com regressao em teste critico | CI falha com log detalhado | AC-02, AC-03 |
| C-03 | PR sem regressao | CI aprova e libera merge | AC-02, AC-03 |
| C-04 | Release para staging com CI verde | CD promove build com sucesso | AC-04 |
| C-05 | Release para producao sem aprovacao manual | Deploy nao inicia | AC-04 |
| C-06 | Coleta de 5 runs de CI consecutivos | SLO de tempo validado/documentado | AC-06 |

## Artefatos esperados

- Arquivos de workflow de CI/CD versionados no repositorio.
- Logs de `lint`, `build` e suites de teste executadas em PR.
- Relatorio de duracao dos jobs de CI com media/p95 inicial.
- Registro de aprovacao manual de release de producao.
- Evidencia da simulacao de rollback.
- Atualizacao de `validation.md` com resultado Pass/Fail final por criterio.

## Evidencias implementadas neste ciclo

- Documento de estrategia: `docs/specs/features/testes-automatizados-e-pipeline-ci-cd/test-strategy.md`
- Suites automatizadas:
  - `tests/unit/validation.test.mjs`
  - `tests/integration/auth-session-flow.test.mjs`
  - `tests/smoke/route-policies.smoke.test.mjs`
  - `tests/auth/middleware-validacao-assinatura-jwt-obrigatoria.test.mjs`
- Scripts de teste: `package.json`
- CI: `.github/workflows/ci.yml`
- CD: `.github/workflows/cd.yml`
