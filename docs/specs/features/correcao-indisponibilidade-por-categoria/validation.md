# Validação - correcao-indisponibilidade-por-categoria

## Evidências por Critério de Aceite

| Critério | Resultado (Pass/Fail) | Evidência | Observações |
| --- | --- | --- | --- |
| AC-01 | Pass | `src/lib/scales/componentAvailability.js`, `tests/unit/componentAvailability.test.mjs` | Fallback legado removido na regra por categoria. |
| AC-02 | Pass | `src/components/organisms/ScaleRegistrationForm/ScaleRegistrationForm.jsx` | UI de escala nao marca indisponivel por categoria com base em `unavailableDates`. |
| AC-03 | Pass | `src/app/api/components/route.js` | Novos componentes nao gravam `unavailableDates`. |
| AC-04 | Pass | `src/app/api/components/me/unavailability/route.js` | PATCH de indisponibilidade nao gera `unavailableDates`. |

## Resultado final

- Status: Aprovado
- Data: 2026-04-29
- Responsável: Codex

## Pendências e Riscos Residuais

- Registros legados com `unavailableDates` podem continuar aparecendo em fluxos antigos que nao sejam por categoria.
