# Evidencias - ajuste-menu-admin-grupos

## Mudancas de Codigo

- Arquivo atualizado:
  - `src/components/organisms/AdminMainNav/AdminMainNav.jsx`
    - substituicao do atalho principal de `/admin/configuracoes` para `/admin/grupos`;
    - troca da chave de ativo de `settingsActive` para `groupsActive`;
    - adicao de `profileActive` para sinalizacao visual de contexto na rota `/admin/configuracoes` via avatar;
    - ajuste de acessibilidade (`aria-label` e `sr-only`) para `Grupos`;
    - troca do icone para representacao de grupos.
  - `src/components/organisms/AdminMainNav/AdminMainNav.module.css`
    - adicao de `avatarFrameActive` para destacar visualmente contexto de perfil/admin configuracoes.

## Validacao Tecnica

- Comando: `npm run lint`
  - Resultado: executado com sucesso, sem erros de lint.

## Checklist de Entrega

- [x] Botao principal do menu administrativo aponta para `Grupos`.
- [x] Estado ativo do botao principal corresponde a `/admin/grupos`.
- [x] Labels acessiveis do botao principal atualizados para `Grupos`.
- [x] Iconografia do botao principal atualizada para semantica de grupos.
- [x] Fluxos secundarios (`Novo grupo`, `Meu perfil`, `Sair`) validados manualmente.
- [x] Documentacao completa gerada (`spec`, `plan`, `validation`, `evidence`).
