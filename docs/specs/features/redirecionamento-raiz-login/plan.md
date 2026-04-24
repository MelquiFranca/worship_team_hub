# Plano Tecnico - redirecionamento-raiz-login

## 1) Referencia da Spec

- Feature: redirecionamento-raiz-login
- Documento: `features/redirecionamento-raiz-login/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Substituir a pagina raiz por um Server Component minimo que execute `redirect('/login')`, garantindo redirecionamento imediato no acesso a `/`. Em seguida, adicionar teste de smoke dedicado para validar que esse redirecionamento permanece declarado no entrypoint raiz.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Atualizar `src/app/page.js` para redirecionar `/` para `/login`. | AC-01 | Manual/Build | diff em `src/app/page.js` |
| T-02 | Criar teste de smoke para validar declaracao do redirecionamento da raiz. | AC-01 | Smoke | arquivo `tests/smoke/root-redirect.smoke.test.mjs` |
| T-03 | Executar suite de smoke e confirmar que `/login` segue publico pelas politicas existentes. | AC-02 | Smoke | log de `npm run test:smoke` |

## 4) Ordem de Execucao

1. Implementar T-01.
2. Implementar T-02.
3. Executar T-03 e registrar evidencias em `validation.md`.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Redirecionamento quebrar caso `page.js` vire Client Component. | Medio | Baixa | Manter arquivo como Server Component sem `'use client'`. |
| Teste de smoke depender do runtime do Next fora do ambiente de execucao do Node test runner. | Medio | Baixa | Validar contrato do entrypoint (`redirect('/login')`) por inspeção de fonte. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: restaurar implementacao anterior de `src/app/page.js` se houver impacto inesperado.
- Plano de rollback: revert do commit da feature.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressos criticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-24 | Redirecionar raiz no App Router com `redirect('/login')`. | Garantir fluxo de entrada unico sem tela intermediaria. | Simplifica entrada e reduz ambiguidades de navegacao. |
| 2026-04-24 | Validar redirecionamento por smoke de codigo-fonte no runner Node. | Evitar falha de import do `next/navigation` fora do runtime do Next. | Mantem protecao de regressao sem dependencias extras. |
