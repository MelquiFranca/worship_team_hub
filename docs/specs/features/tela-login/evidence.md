# Evidencias - tela-login

## Implementacao Next.js

- Rota criada: `src/app/login/page.js`
- Estilos de pagina: `src/app/login/page.module.css`
- Componente principal: `src/components/organisms/LoginCard/LoginCard.jsx`
- Estilos do componente: `src/components/organisms/LoginCard/LoginCard.module.css`

## Criterios funcionais cobertos

- Campos obrigatorios com validacao no submit.
- Toggle de senha com preservacao de foco e selecao.
- Estado de loading no submit e bloqueio de multiplos cliques.
- Mensagem de erro para credenciais invalidas e mensagem de sucesso mock.
- Estrutura visual com logo, divisor OR, CTA social e rodape de cadastro.
- Layout responsivo com breakpoints para mobile e desktop.

## Validacoes executadas

- `npm run lint` executado sem erros.
- `npm run build` executado sem erros.
- Build gerou rota estatica `/login`.
