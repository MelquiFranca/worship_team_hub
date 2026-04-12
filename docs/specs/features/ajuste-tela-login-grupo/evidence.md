# Evidencias - ajuste-tela-login-grupo

## Implementacao Next.js

- Rota login: Ajustada com metadata em PT-BR e fundo usando tokens de tema.
- Componente LoginCard: Atualizado com bloco de identidade do grupo, copy localizada e fluxo de login em PT-BR.
- Estilos do LoginCard: Reescritos para usar tokens globais, responsividade e foco acessivel.
- Fonte de identidade do grupo (nome/foto): Mock definido com fallback visual por iniciais.

## Cobertura funcional esperada

- Textos da tela de login em portugues do Brasil.
- Mensagens de validacao localizadas em PT-BR.
- Header com foto e nome do grupo no lugar de `Instagram`.
- Fallback visual quando foto do grupo estiver indisponivel.
- Responsividade e acessibilidade preservadas.

## Validacoes executadas

- `npm run lint`
- `npm run build`
