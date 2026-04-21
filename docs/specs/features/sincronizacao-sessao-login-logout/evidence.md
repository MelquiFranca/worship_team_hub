# Evidencias - sincronizacao-sessao-login-logout

## Implementacao Next.js

- Refatoracao de sessao para refresh reutilizavel:
  - `src/context/AuthSessionContext.jsx`
- Refresh explicito no pos-login:
  - `src/components/organisms/LoginCard/LoginCard.jsx`
- Sincronizacao de configuracoes com autenticacao:
  - `src/context/GroupSettingsContext.jsx`
- Limpeza de estado de perfil no menu apos logout:
  - `src/components/organisms/MainBottomNav/MainBottomNav.jsx`

## Validacoes executadas

```bash
npm run lint
```

Resultado:

- `✔ No ESLint warnings or errors`

## Rastreabilidade rapida

- AC-01: `AuthSessionContext` + `LoginCard`
- AC-02: `GroupSettingsContext` (carregamento remoto condicionado a sessao)
- AC-03: `AuthSessionContext`, `GroupSettingsContext`, `MainBottomNav`, `clientSessionCleanup`
- AC-04: lint concluido sem erros
