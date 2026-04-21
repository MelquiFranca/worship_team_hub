# Validacao - migracao-indisponibilidade-menu-avatar

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | `src/app/minha-indisponibilidade/page.js`, `src/app/minha-indisponibilidade/page.module.css` | Nova rota dedicada renderiza `ComponentUnavailabilityForm`. |
| AC-02 | Pass | `src/components/organisms/MainBottomNav/MainBottomNav.jsx` | Popover do avatar contem `Editar perfil` e `Minha indisponibilidade` para componente. |
| AC-03 | Pass | `src/lib/auth/policies.js` | `/minha-indisponibilidade` incluida em `MEMBER_PATHS`. |

## Resultado final

- Status: Concluido
- Data: 2026-04-20
- Responsavel: Codex

## Pendencias e Riscos Residuais

- Validacao foi principalmente manual; pode evoluir para teste E2E de navegacao do popover.

## Complemento de validacao (2026-04-20)

| Item incremental | Resultado | Evidencia | Observacoes |
| --- | --- | --- | --- |
| `group-app` preserva edicao da propria indisponibilidade | Pass | `src/components/organisms/ComponentUnavailabilityForm/ComponentUnavailabilityForm.jsx` | Calendario e acao de salvar continuam disponiveis para o perfil de grupo. |
| `group-app` visualiza indisponibilidades da equipe agrupadas por data | Pass | `src/app/api/components/unavailability/route.js`, `src/components/organisms/ComponentUnavailabilityForm/ComponentUnavailabilityForm.jsx` | Agrupamento server-side por data com contagens e renderizacao dedicada na UI. |
| Lista agrupada exibe avatar antes do nome do componente | Pass | `src/app/api/components/unavailability/route.js`, `src/components/organisms/ComponentUnavailabilityForm/ComponentUnavailabilityForm.jsx` | Payload inclui `photoUrl`; UI renderiza avatar com fallback textual. |
