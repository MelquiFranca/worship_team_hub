# Validacao - correcao-deploy-netlify-baseline-env

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | `netlify.toml` versionado com `command = "npm run build"` e plugin `@netlify/plugin-nextjs`. | Define baseline correto de build no repositorio. |
| AC-02 | Pass | `next.config.mjs` com deteccao de `next start` em `NETLIFY=true` e erro acionavel para ajuste do build command. | Nao altera regras de segredos obrigatorios; apenas melhora diagnostico. |
| AC-03 | Pass | Atualizacoes em `README.md` e `docs/setup/production-env-secrets.md` com checklist Netlify + segredos obrigatorios. | Inclui observacao de sobrescrita por configuracao UI. |

## Resultado final

- Status: Aprovado
- Data: 2026-04-23
- Responsavel: Codex (GPT-5)

## Pendencias e Riscos Residuais

- A configuracao de `Build command` no painel do Netlify pode continuar sobrescrevendo `netlify.toml`; a correcao definitiva exige ajuste manual no site.
- Segredos obrigatorios (`MONGODB_URI` e `AUTH_JWT_SECRET`/`JWT_SECRET`) permanecem responsabilidade operacional do ambiente.
- Validacao tecnica executada em 2026-04-23:
  - `npm run lint` (Pass)
  - `NODE_ENV=production AUTH_JWT_SECRET=<dummy-32+> MONGODB_URI=<dummy-uri> npm run build` (Pass)
