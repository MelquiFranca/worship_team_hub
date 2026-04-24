# Spec Funcional - correcao-runtime-login-push-permission

## 1) Contexto

- Data: 2026-04-24
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Frontend, Produto

## 2) Problema

Ao abrir a pagina de login, ocorre erro de runtime no `RootLayout` relacionado ao componente de permissao de notificacoes. Em refresh, o erro desaparece, indicando instabilidade de carregamento no bootstrap inicial.

## 3) Objetivo

Eliminar o erro de runtime no acesso inicial ao login, mantendo o prompt de permissao de notificacoes funcional para usuarios elegiveis.

## 4) Escopo

- Ajustar estrategia de carregamento do componente `PushNotificationPermissionPrompt`.
- Garantir renderizacao segura no `RootLayout` sem quebrar login.
- Manter comportamento funcional existente do prompt.

## 5) Nao-Escopo

- Alterar regras de negocio de permissao de notificacoes.
- Alterar backend de push/subscription.

## 6) Usuarios e Cenarios

- Usuario-alvo: qualquer usuario ao abrir `/login` ou outras rotas iniciais.
- Cenarios principais:
  - Abertura inicial de `/login` sem erro de runtime.
  - Prompt continua disponivel no cliente para cenarios elegiveis.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Abrir `/login` nao gera erro de runtime no `RootLayout`. | Validacao manual em ambiente local. | Alta |
| AC-02 | Prompt de permissao continua sendo montado no cliente sem SSR direto no layout. | Inspecao de codigo + validacao manual. | Alta |
| AC-03 | Ajuste nao introduz erros de lint/testes unitarios. | `npm run lint` e `npm run test:unit`. | Alta |

## 8) Requisitos Nao Funcionais

- Confiabilidade: nao pode haver regressao de bootstrap da aplicacao.
- Manutenibilidade: mudanca deve ser pequena e isolada.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Falha ao avaliar componente no SSR inicial | Componente deve ser carregado apenas no cliente para evitar erro no layout. |

## 10) Dependencias e Restricoes

- Dependencias: Next.js dynamic import em componente client.
- Restricoes: manter estrutura atual do `RootLayout`.

## 11) Suposicoes

- O erro intermitente esta ligado ao carregamento do prompt no bootstrap inicial.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-01 |
| AC-03 | T-03 |
