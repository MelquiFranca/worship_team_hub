# Spec Funcional - bloqueio-login-grupo-inativo

## 1) Contexto

- Data: 2026-04-21
- Autor(a): Codex
- Status: Validated
- Stakeholders: Produto, Backend, Frontend, Suporte

## 2) Problema

Usuarios vinculados a grupos com status `inactive` ainda conseguiam autenticar no sistema. Isso gerava inconsistencias operacionais e falta de clareza para o usuario final sobre o motivo do bloqueio esperado.

## 3) Objetivo

Bloquear autenticacao para usuarios de grupos inativos e exibir mensagem explicita com o status atual do grupo no fluxo de login.

## 4) Escopo

- Incluir regra de bloqueio por status do grupo no fluxo de autenticacao por senha.
- Aplicar a mesma regra na validacao de sessao (`/api/auth/me`) e renovacao (`/api/auth/refresh`).
- Introduzir codigo de erro dedicado para grupo inativo (`AUTH_GROUP_INACTIVE`).
- Exibir mensagem amigavel no login contendo o status atual do grupo (`inactive`).
- Tornar o fallback de audiencia do login deterministico por codigo de erro.

## 5) Nao-Escopo

- Criacao de fluxo de reativacao de grupo.
- Alteracao de regras administrativas de edicao de grupo.
- Mudancas em layout da tela de login alem do tratamento de mensagem.
- Introducao de novos testes E2E nesta entrega.

## 6) Usuarios e Cenarios

- Usuario-alvo:
  - `group-app`
  - `component-app`
- Cenarios principais:
  - Usuario de grupo inativo tenta logar e recebe bloqueio com mensagem de status.
  - Usuario de grupo ativo segue fluxo normal de autenticacao.
  - Sessao previamente emitida para grupo que ficou inativo e bloqueada na proxima verificacao/refresh.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Login por senha falha com erro de autorizacao quando `groupStatus` do usuario e `inactive`. | Revisao de codigo em `service.js` + teste manual de login com grupo inativo. | Alta |
| AC-02 | API de auth retorna codigo de erro dedicado `AUTH_GROUP_INACTIVE`. | Revisao de codigo em `errors.js` + inspecao de resposta HTTP. | Alta |
| AC-03 | Tela de login exibe mensagem com status atual do grupo quando receber `AUTH_GROUP_INACTIVE`. | Revisao de codigo em `LoginCard.jsx` + teste manual de UI. | Alta |
| AC-04 | Fallback de audiencia no login deixa de depender de texto e passa a usar codigos de erro (`AUTH_AUDIENCE_FORBIDDEN`/`AUTH_ROLE_FORBIDDEN`). | Revisao de codigo em `LoginCard.jsx`. | Media |
| AC-05 | Sessoes de usuarios de grupos inativos tambem sao bloqueadas em `/api/auth/me` e `/api/auth/refresh`. | Revisao de codigo em `service.js` (`verifyAccessSession` e `refreshAuthSession`). | Alta |

## 8) Requisitos Nao Funcionais

- Seguranca: negar acesso de grupo inativo em todos os gates de sessao relevantes (login, verify, refresh).
- Confiabilidade: usar codigo de erro dedicado para evitar ambiguidade de tratamento no frontend.
- UX: mensagem clara e acionavel para o usuario final sobre status do grupo.
- Compatibilidade: preservar funcionamento dos demais erros de autenticacao.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Usuario com credenciais validas, mas grupo inativo | Retornar `AUTH_GROUP_INACTIVE` com status HTTP `403` e mensagem com `inactive`. |
| ER-02 | Usuario com credenciais invalidas | Manter retorno de erro de credenciais sem regressao. |
| ER-03 | Usuario sem permissao para audiencia solicitada | Manter erro de audiencia/perfil e fallback controlado por codigo no frontend. |
| ER-04 | Sessao existente de grupo que ficou inativo | Bloquear em `verifyAccessSession` e `refreshAuthSession` com `AUTH_GROUP_INACTIVE`. |

## 10) Dependencias e Restricoes

- Dependencias:
  - `src/lib/auth/userSource.js`
  - `src/lib/auth/service.js`
  - `src/lib/auth/errors.js`
  - `src/lib/auth/constants.js`
  - `src/components/organisms/LoginCard/LoginCard.jsx`
- Restricoes:
  - Sem migracoes de banco.
  - Sem feature flag para rollout.

## 11) Suposicoes

- Campo `groups.status` segue contrato `active|inactive`.
- Usuarios sem `groupId` (ex.: admin) nao sao impactados pela nova regra.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-02, T-03 |
| AC-02 | T-01 |
| AC-03 | T-04 |
| AC-04 | T-04 |
| AC-05 | T-03 |
