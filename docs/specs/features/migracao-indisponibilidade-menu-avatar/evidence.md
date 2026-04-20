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
