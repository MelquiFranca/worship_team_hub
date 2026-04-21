# Evidencias - bloqueio-login-grupo-inativo

## Mudancas de Codigo

- Arquivos atualizados:
  - `src/lib/auth/constants.js`
    - adicao de `GROUP_INACTIVE: 403` em `AUTH_STATUS_CODES`.
  - `src/lib/auth/errors.js`
    - adicao de `AUTH_GROUP_INACTIVE` em `AUTH_ERROR_CODES`;
    - mensagem padrao para grupo inativo com status atual.
  - `src/lib/auth/userSource.js`
    - lookup em `groups` para anexar `groupStatus` e `groupName` aos usuarios autenticaveis.
  - `src/lib/auth/service.js`
    - adicao de `ensureUserGroupIsActive`;
    - bloqueio aplicado em login (`authenticateWithPassword`), refresh (`refreshAuthSession`) e verify (`verifyAccessSession`).
  - `src/components/organisms/LoginCard/LoginCard.jsx`
    - mapeamento de `AUTH_GROUP_INACTIVE` na mensagem do login;
    - propagacao de `error.code` no erro lancado;
    - fallback de audiencia por codigo em vez de matching textual.

## Validacao Tecnica

- Comando executado:
  - `npm run lint -- --file src/lib/auth/constants.js --file src/lib/auth/errors.js --file src/lib/auth/service.js --file src/lib/auth/userSource.js --file src/components/organisms/LoginCard/LoginCard.jsx`
- Resultado:
  - execucao concluida com sucesso, sem erros de lint.

## Checklist de Entrega

- [x] Login de usuarios de grupo inativo bloqueado no backend.
- [x] Codigo de erro dedicado (`AUTH_GROUP_INACTIVE`) implementado.
- [x] Mensagem de login inclui status atual do grupo (`inactive`).
- [x] Validacao de sessao e refresh tambem bloqueiam grupo inativo.
- [x] Fallback de audiencia no frontend baseado em codigo de erro.
- [x] Documentacao SDD completa (`spec`, `plan`, `validation`, `evidence`).
