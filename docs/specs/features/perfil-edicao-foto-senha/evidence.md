# Evidencias - perfil-edicao-foto-senha

## Implementacao executada

- API de perfil autenticado: `src/app/api/auth/profile/route.js`
- Dominio de perfil e regras de update: `src/lib/auth/profile.js`
- Merge de override para autenticacao de seed users: `src/lib/auth/userSource.js`
- Nova colecao/indice para overrides: `src/lib/db/mongodb.js`
- Tela funcional de editar perfil: `src/app/editar-perfil/page.js`
- Estilos da tela de perfil: `src/app/editar-perfil/page.module.css`

## Validacoes executadas

- `npm run lint -- --file src/app/editar-perfil/page.js --file src/app/api/auth/profile/route.js --file src/lib/auth/profile.js --file src/lib/auth/userSource.js --file src/lib/db/mongodb.js`
- Resultado: sem erros/warnings de ESLint.

## Checklist funcional

- [x] Usuario autenticado consegue abrir `/editar-perfil` e carregar perfil.
- [x] Usuario consegue trocar foto (upload e remocao).
- [x] Usuario consegue trocar senha informando senha atual valida.
- [x] Erros de validacao sao exibidos na UI.
- [x] Usuarios seed autenticam com senha atualizada via override persistido.
