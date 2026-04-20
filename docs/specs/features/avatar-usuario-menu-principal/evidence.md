# Evidencias - avatar-usuario-menu-principal

## Implementacao relacionada

- Avatar do menu principal com resolucao de nome/foto do usuario logado: `src/components/organisms/MainBottomNav/MainBottomNav.jsx`
- Endpoint de perfil autenticado consumido pelo menu: `src/app/api/auth/profile/route.js`
- Servico de perfil autenticado (serializacao de foto e dados): `src/lib/auth/profile.js`

## Validacoes executadas

- Comando:
  - `npm run lint -- --file src/components/organisms/MainBottomNav/MainBottomNav.jsx --file src/app/api/auth/profile/route.js --file src/lib/auth/profile.js`
- Resultado:
  - Sem erros/warnings de ESLint.
  - Observacao do tooling: aviso informativo de deprecacao do `next lint` no Next.js 16.

## Evidencias funcionais (code-based)

- Prioridade de identidade do avatar:
  - `avatarName = profile?.name || sessionName || 'Perfil'`
  - `avatarPhoto = profile?.photo || sessionPhoto`
- Fallback de foto para iniciais:
  - Render condicional `avatarPhoto ? <Image .../> : <span className={styles.avatarFallback}>{initials}</span>`
- Resiliencia em falha de perfil:
  - `catch` no carregamento de perfil com `setProfile(null)` para manter fallback por sessao.

## Checklist funcional

- [x] Botao de perfil exibe foto do usuario logado quando disponivel.
- [x] Sem foto, botao de perfil exibe iniciais do nome do usuario logado.
- [x] Menu de avatar preserva opcoes existentes e navegacao.
- [x] Validacao tecnica (lint) executada com sucesso.

## Artefatos de documentacao

- `docs/specs/features/avatar-usuario-menu-principal/spec.md`
- `docs/specs/features/avatar-usuario-menu-principal/plan.md`
- `docs/specs/features/avatar-usuario-menu-principal/validation.md`
- `docs/specs/features/avatar-usuario-menu-principal/evidence.md`
