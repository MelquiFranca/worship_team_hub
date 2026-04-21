# Evidencias - avatar-usuario-menu-principal

## Implementacao relacionada

- Avatar do menu principal com resolucao de nome/foto do usuario logado: `src/components/organisms/MainBottomNav/MainBottomNav.jsx`
- Header do popover do avatar com identidade do grupo (logo + nome): `src/components/organisms/MainBottomNav/MainBottomNav.jsx`
- Estilos do header do popover do avatar: `src/components/organisms/MainBottomNav/MainBottomNav.module.css`
- Endpoint de perfil autenticado consumido pelo menu: `src/app/api/auth/profile/route.js`
- Servico de perfil autenticado (serializacao de foto e dados): `src/lib/auth/profile.js`

## Validacoes executadas

- Comando:
  - `npm run lint`
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
- Header do grupo no popover:
  - `groupName = normalizeString(settings?.name) || 'Grupo'`
  - `groupLogo = normalizeString(settings?.photo)`
  - Header renderizado antes dos itens com fallback por iniciais em `groupInitials`.

## Checklist funcional

- [x] Botao de perfil exibe foto do usuario logado quando disponivel.
- [x] Sem foto, botao de perfil exibe iniciais do nome do usuario logado.
- [x] Menu de avatar preserva opcoes existentes e navegacao.
- [x] Menu de avatar exibe header com logo e nome do grupo.
- [x] Sem logo do grupo, menu exibe fallback textual por iniciais.
- [x] Validacao tecnica (lint) executada com sucesso.

## Evolucao incremental (2026-04-20)

- Ajustado fechamento do menu flutuante do avatar ao clicar em itens navegaveis:
  - `Editar perfil`
  - `Minha indisponibilidade`
- Arquivo alterado: `src/components/organisms/MainBottomNav/MainBottomNav.jsx`.

## Validacao incremental

- `npm run lint -- --file src/components/organisms/MainBottomNav/MainBottomNav.jsx`
- Resultado: sem erros/warnings de ESLint.

## Artefatos de documentacao

- `docs/specs/features/avatar-usuario-menu-principal/spec.md`
- `docs/specs/features/avatar-usuario-menu-principal/plan.md`
- `docs/specs/features/avatar-usuario-menu-principal/validation.md`
- `docs/specs/features/avatar-usuario-menu-principal/evidence.md`
