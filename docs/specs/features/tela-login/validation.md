# Validação - tela-login

## Evidências por Critério de Aceite

| Critério | Resultado (Pass/Fail) | Evidência | Observações |
| --- | --- | --- | --- |
| AC-01 | Pass | `src/app/login/page.js`, `src/components/organisms/LoginCard/LoginCard.jsx`, `src/components/organisms/LoginCard/LoginCard.module.css` | Composicao completa da tela portada para Next.js com os elementos obrigatorios. |
| AC-02 | Pass | `src/components/organisms/LoginCard/LoginCard.jsx` | Campos obrigatorios com validacao no submit e foco no primeiro campo invalido. |
| AC-03 | Pass | `src/components/organisms/LoginCard/LoginCard.jsx` | Toggle SHOW/HIDE alterna tipo do campo e preserva foco/selecao. |
| AC-04 | Pass | `src/components/organisms/LoginCard/LoginCard.jsx` | Submit possui loading, bloqueio de multiplos cliques e tratamento de erro/sucesso mock. |
| AC-05 | Pass | `src/components/organisms/LoginCard/LoginCard.module.css`, `src/app/login/page.module.css` | Breakpoints mobile e desktop aplicados sem quebra da estrutura principal. |
| AC-06 | Pass | `src/components/organisms/LoginCard/LoginCard.jsx`, `src/components/organisms/LoginCard/LoginCard.module.css` | Labels, aria attributes e foco visivel nos elementos interativos. |

## Resultado final

- Status: Aprovado
- Data: 2026-04-11
- Responsável: Codex

## Pendências e Riscos Residuais

- Integracao real com backend/OAuth permanece fora de escopo neste ciclo.
