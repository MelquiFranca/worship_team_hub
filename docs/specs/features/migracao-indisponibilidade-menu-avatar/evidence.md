# Evidencias - migracao-indisponibilidade-menu-avatar

## Implementacao executada

- Nova pagina dedicada: `src/app/minha-indisponibilidade/page.js`
- Estilo da nova pagina: `src/app/minha-indisponibilidade/page.module.css`
- Link no menu do avatar: `src/components/organisms/MainBottomNav/MainBottomNav.jsx`
- Politica de acesso de membro: `src/lib/auth/policies.js`

## Validacoes executadas

- `npm run lint -- --file src/components/organisms/MainBottomNav/MainBottomNav.jsx --file src/lib/auth/policies.js --file src/app/minha-indisponibilidade/page.js`
- Resultado: sem erros/warnings de ESLint.

## Checklist funcional

- [x] Funcionalidade de indisponibilidade nao foi removida.
- [x] Funcionalidade foi migrada para pagina dedicada.
- [x] Acesso disponivel no mesmo menu flutuante de `Editar perfil`.
- [x] Rota protegida pela politica de autenticacao existente.

## Evolucao incremental (2026-04-20)

- `group-app` passou a manter o fluxo de edicao da propria indisponibilidade na mesma tela.
- Adicionada visualizacao agrupada das indisponibilidades da equipe para `group-app`.
- Endpoint dedicado para agrupamento por data: `src/app/api/components/unavailability/route.js`.
- Lista agrupada com avatar antes do nome do componente (fallback por iniciais quando sem foto):
  - `src/components/organisms/ComponentUnavailabilityForm/ComponentUnavailabilityForm.jsx`
  - `src/components/organisms/ComponentUnavailabilityForm/ComponentUnavailabilityForm.module.css`

## Validacao incremental

- `npm run lint -- --file src/app/api/components/unavailability/route.js --file src/components/organisms/ComponentUnavailabilityForm/ComponentUnavailabilityForm.jsx`
- Resultado: sem erros/warnings de ESLint.
