# Plano Tecnico - correcao-sessao-ociosa-auth

## 1) Referencia da Spec

- Feature: correcao-sessao-ociosa-auth
- Documento: `features/correcao-sessao-ociosa-auth/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Aplicar tratamento de sessao ociosa em duas frentes complementares:
- servidor (middleware): trocar JSON bruto por redirect em navegacao de paginas protegidas com sessao invalida;
- cliente (`requestJson`): recuperar sessao com refresh silencioso, retry automatico e fallback de redirect para login quando nao houver recuperacao.

Tambem alinhar pontos de consumo fora do helper para reduzir comportamento inconsistente em expiracao de sessao.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Criar documentacao da feature (`spec.md`, `plan.md`, `validation.md`) e garantir matriz `AC-* -> T-*`. | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09 | Revisao documental | Arquivos em `docs/specs/features/correcao-sessao-ociosa-auth/` |
| T-02 | Atualizar `src/middleware.js` para redirecionar requests de paginas protegidas com falhas de sessao e manter resposta tecnica JSON para API/configuracao ausente. | AC-01, AC-02, AC-03 | Unitario | Testes unitarios de middleware/resolvedor de resposta |
| T-03 | Evoluir `src/lib/api/http.js` com refresh silencioso (missing/expired), retry unico, single-flight, bypass para endpoints de auth e redirect em falha de refresh. | AC-04, AC-05, AC-06, AC-07, AC-08 | Unitario | Testes em `tests/unit/http-auth-redirect.test.mjs` |
| T-04 | Ajustar consumidores para fluxo compartilhado de recuperacao (`AuthSessionContext` e carregamento de componentes do cadastro de escalas). | AC-09 | Regressao tecnica | Diff em frontend + execucao de suites |
| T-05 | Executar suites (`test:unit`, `test:integration`, `test:smoke`), preencher `validation.md` e revisar checklist. | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06, AC-07, AC-08, AC-09 | Automatizado + revisao | Logs de comandos + `validation.md` |

## 4) Ordem de Execucao

1. T-01: documentacao da feature.
2. T-02: middleware para navegacao de paginas.
3. T-03: helper HTTP com refresh silencioso/single-flight.
4. T-04: alinhamento dos consumidores.
5. T-05: validacao automatizada e fechamento documental.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Loop de refresh em endpoint de auth | Alto | Media | Lista explicita de endpoints excluidos e teste dedicado. |
| Duplicidade de refresh em concorrencia | Alto | Media | Single-flight em promessa compartilhada + teste paralelo. |
| Redirect incorreto entre area app e admin | Medio | Baixa | Reuso de policy/loginPath existente + testes dedicados por area. |
| Regressao em fluxo de bootstrap de sessao | Medio | Baixa | Ajuste pontual em `AuthSessionContext` com suites completas. |

## 6) Estrategia de Rollout

- Feature flag: Nao.
- Migracao necessaria: Nao.
- Plano de fallback: remover tentativa de refresh automatico e restaurar comportamento anterior de erro.
- Plano de rollback: reverter alteracoes em middleware/helper/contexto e arquivos de teste desta feature.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-25 | Redirecionar apenas navegacao de pagina no middleware para falhas de sessao. | Evitar JSON bruto em UI sem alterar contratos tecnicos de erro. | UX mais consistente em rotas protegidas. |
| 2026-04-25 | Implementar refresh silencioso com single-flight no `requestJson`. | Recuperar sessao automaticamente e reduzir falhas apos inatividade. | Menos friccao de uso e menos logouts desnecessarios. |
| 2026-04-25 | Nao aplicar refresh automatico para `/api/auth/login|refresh|logout`. | Evitar loops e ambiguidade em endpoints de autenticacao. | Controle previsivel de fluxo de auth. |
