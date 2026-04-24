# Validacao - redirecionamento-auth-token-missing-login

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | `tests/unit/http-auth-redirect.test.mjs` (teste: `redireciona para /login...`) + execucao `npm run test:unit` em 2026-04-24 | Confirmado redirect para `/login` em rota app com `401 + AUTH_TOKEN_MISSING`. |
| AC-02 | Pass | `tests/unit/http-auth-redirect.test.mjs` (teste: `redireciona para /admin/login...`) + execucao `npm run test:unit` em 2026-04-24 | Confirmado redirect para `/admin/login` em rota admin protegida. |
| AC-03 | Pass | `tests/unit/http-auth-redirect.test.mjs` (teste: `evita loop quando ja esta em rota de login`) + execucao `npm run test:unit` em 2026-04-24 | Confirmada ausencia de redirect adicional em `/login` e `/admin/login`. |
| AC-04 | Pass | `tests/unit/http-auth-redirect.test.mjs` (teste: `mantem comportamento atual para outros erros 401...`) + execucao `npm run test:unit` em 2026-04-24 | Sem redirect para outros codigos; erro segue sendo lancado conforme comportamento existente. |

## Resultado final

- Status: Aprovado
- Data: 2026-04-24
- Responsavel: Codex (GPT-5)

## Pendencias e Riscos Residuais

- Nao ha pendencias bloqueantes para esta feature dentro do escopo definido.
- Risco residual baixo: fluxos de navegacao dependem de `window.location.pathname`; novas areas autenticadas fora dos prefixos atuais podem requerer ajuste explicito de regra.

## Revisao com Checklist

- Problema/objetivo, escopo/nao-escopo e criterios mensuraveis: atendidos em `spec.md`.
- Rastreabilidade AC-T e estrategia de teste por tarefa: atendidos em `spec.md` e `plan.md`.
- Evidencias por criterio, riscos e resultado final: atendidos neste `validation.md`.
