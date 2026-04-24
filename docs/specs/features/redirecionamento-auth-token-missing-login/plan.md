# Plano Tecnico - redirecionamento-auth-token-missing-login

## 1) Referencia da Spec

- Feature: redirecionamento-auth-token-missing-login
- Documento: `features/redirecionamento-auth-token-missing-login/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Adicionar tratamento central no `requestJson` para identificar `401 + AUTH_TOKEN_MISSING` e disparar redirecionamento de acordo com a area atual inferida pelo pathname no browser. A logica de anti-loop fica no mesmo helper para garantir consistencia global e reduzir duplicacao nos componentes.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Criar documentacao da feature (`spec.md`, `plan.md`, `validation.md`) com rastreabilidade AC-T. | AC-01, AC-02, AC-03, AC-04 | Revisao documental | Arquivos em `docs/specs/features/redirecionamento-auth-token-missing-login/` |
| T-02 | Implementar no `src/lib/api/http.js` deteccao de `401 + AUTH_TOKEN_MISSING`, selecao de login por area (app/admin) e anti-loop em rotas de login. | AC-01, AC-02, AC-03, AC-04 | Unitario | Diff em `src/lib/api/http.js` |
| T-03 | Criar testes unitarios do helper HTTP cobrindo redirect app/admin, anti-loop e preservacao para outros erros. | AC-01, AC-02, AC-03, AC-04 | Unitario (`node:test`) | Arquivo em `tests/unit/` + execucao de testes |
| T-04 | Executar testes relevantes e registrar evidencias reais em `validation.md`, incluindo riscos residuais. | AC-04 | Unitario/manual tecnico | Log de comando e resultado documentado |

## 4) Ordem de Execucao

1. T-01 documentacao da feature.
2. T-02 implementacao no helper central.
3. T-03 testes unitarios dedicados.
4. T-04 execucao de testes e consolidacao em validacao.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Redirecionar para login errado em area admin. | Alto | Media | Inferir area por pathname admin protegido (`/admin` ou `/admin/*`) e validar com teste unitario dedicado. |
| Loop de redirecionamento nas telas de login. | Alto | Media | Implementar guarda explicita para `/login` e `/admin/login` e validar com teste unitario. |
| Regressao em tratamento de outros erros HTTP. | Medio | Baixa | Manter throw existente e cobrir com teste de nao-redirecionamento para codigos diferentes. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: remover tratamento de redirect no helper e manter somente throw original.
- Plano de rollback: reverter alteracoes em `src/lib/api/http.js` e arquivo de teste desta feature.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressos criticos

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-24 | Centralizar redirecionamento por `AUTH_TOKEN_MISSING` em `requestJson`. | Evitar duplicacao de tratamento em varios componentes e garantir consistencia. | Menor risco de lacunas entre fluxos app/admin. |
| 2026-04-24 | Inferir destino por pathname atual no browser (`/admin` => `/admin/login`; demais => `/login`). | Atender requisito de area admin sem alterar contratos de chamada existentes. | Comportamento contextual transparente para consumidores do helper. |
