# Estrategia de Testes MVP - testes-automatizados-e-pipeline-ci-cd

## Escopo minimo obrigatorio

- Autenticacao e sessao JWT:
  - assinatura/token malformado/expirado
  - presenca obrigatoria de segredo JWT
  - refresh token com rotacao e revogacao
- Rotas e politicas criticas:
  - protecao de area admin
  - separacao de permissoes por perfil/audiencia
- Validacoes de entrada:
  - normalizacao de strings e datas ISO
  - rejeicao de payloads invalidos

## Matriz de suites

| Suite | Objetivo | Comando | Gate CI |
| --- | --- | --- | --- |
| Unit | Garantir regras puras e deterministicas (normalizacao/validacao) | `npm run test:unit` | Obrigatorio |
| Integration | Validar fluxo real entre modulos de auth/session | `npm run test:integration` | Obrigatorio |
| Smoke | Cobrir comportamento minimo de rotas/politicas criticas do MVP | `npm run test:smoke` | Obrigatorio |

## Responsabilidades

- Dev: manter testes da feature atualizados no mesmo PR da mudanca.
- QA: validar cenarios de regressao funcional e monitorar flakiness.
- Engenharia/DevOps: manter CI/CD verde, SLO de pipeline e rastreabilidade de artefatos.

## Politica de quality gate

- Merge permitido apenas com `lint`, `build` e `test` verdes.
- Falha em qualquer job bloqueia merge ate correcao.
- Releases para producao exigem gate manual no ambiente `production`.

## SLO operacional inicial

- Tempo alvo de feedback da CI para PR padrao: <= 10 minutos.
- Monitoramento por `ci-metrics.txt` publicado como artefato em cada run.
