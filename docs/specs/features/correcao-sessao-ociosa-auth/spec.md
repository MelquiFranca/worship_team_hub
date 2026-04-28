# Spec Funcional - correcao-sessao-ociosa-auth

## 1) Contexto

- Data: 2026-04-25
- Autor(a): Codex (GPT-5)
- Status: Implemented
- Stakeholders: Frontend (app/admin), API/auth

## 2) Problema

Ao deixar a aplicacao aberta por um periodo ocioso, a sessao pode expirar e o usuario passa a receber erros de autenticacao (`AUTH_TOKEN_MISSING` ou `AUTH_TOKEN_EXPIRED`). Em parte dos fluxos, isso aparece como erro bruto na interface ou resposta JSON de middleware em navegacao de pagina protegida, em vez de recuperacao silenciosa ou redirecionamento consistente para login.

## 3) Objetivo

Padronizar o comportamento de sessao ociosa para:
- tentar renovacao silenciosa de sessao no cliente (uma vez por requisicao);
- redirecionar para login quando a sessao nao puder ser recuperada;
- evitar exibicao de JSON bruto em navegacao de paginas protegidas.

## 4) Escopo

- Atualizar middleware para redirecionar navegacao de pagina protegida para login quando houver falhas de sessao (`AUTH_TOKEN_MISSING`, `AUTH_TOKEN_EXPIRED`, `AUTH_TOKEN_MALFORMED`, `AUTH_TOKEN_INVALID`).
- Manter respostas tecnicas em JSON para cenario de configuracao ausente (`AUTH_CONFIG_MISSING`).
- Evoluir `requestJson` com refresh silencioso para `401 + AUTH_TOKEN_MISSING|AUTH_TOKEN_EXPIRED`, com retry da requisicao original.
- Implementar controle single-flight para refresh (evitar corrida entre requisicoes simultaneas).
- Nao tentar refresh silencioso para endpoints de auth (`/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`).
- Ajustar pontos que ainda usam fluxo manual para sessao/componentes, centralizando no helper HTTP compartilhado.

## 5) Nao-Escopo

- Alterar TTL atual de access/refresh token.
- Alterar contrato de payload das rotas de auth.
- Introduzir novo endpoint de auth.
- Refatorar politicas de permissao/audiencia.

## 6) Usuarios e Cenarios

- Usuario-alvo: usuarios do app, componentes e administradores.
- Cenarios principais:
  - Usuario em `/escalas` sem token valido deve ir para `/login` ao navegar.
  - Usuario em `/admin/*` sem token valido deve ir para `/admin/login` ao navegar.
  - Requisicao API no cliente com token expirado deve tentar refresh silencioso e repetir a chamada automaticamente.
  - Falha no refresh deve encerrar fluxo com redirecionamento para login.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Middleware redireciona navegacao de pagina protegida da area app para `/login` quando status de sessao for `AUTH_TOKEN_MISSING`. | Teste unitario de middleware com request de pagina protegida e sem token. | Alta |
| AC-02 | Middleware redireciona navegacao de pagina protegida da area admin para `/admin/login` quando status de sessao for `AUTH_TOKEN_MISSING`. | Teste unitario de middleware com request `/admin/*` e sem token. | Alta |
| AC-03 | Para contexto API, falhas de sessao continuam em formato JSON 401 (sem mascarar como redirect). | Teste unitario do resolvedor de resposta de falha no middleware/helper. | Alta |
| AC-04 | `requestJson` tenta refresh silencioso uma unica vez para `401 + AUTH_TOKEN_MISSING`, e em sucesso repete a requisicao original. | Teste unitario com mock de sequencia (fail -> refresh ok -> retry ok). | Alta |
| AC-05 | `requestJson` tenta refresh silencioso uma unica vez para `401 + AUTH_TOKEN_EXPIRED`, e em sucesso repete a requisicao original. | Teste unitario com mock de sequencia. | Alta |
| AC-06 | Requisicoes concorrentes compartilham o mesmo refresh em andamento (single-flight). | Teste unitario com duas chamadas paralelas e contagem de refresh = 1. | Alta |
| AC-07 | `requestJson` nao tenta refresh para `/api/auth/login`, `/api/auth/refresh` e `/api/auth/logout`. | Teste unitario validando ausencia de chamada ao endpoint de refresh. | Media |
| AC-08 | Quando refresh falha, cliente redireciona para login correto e lanca erro ao chamador. | Teste unitario com falha de refresh + verificacao de redirect e throw. | Alta |
| AC-09 | `AuthSessionContext` e carregamento de componentes no cadastro de escalas passam a usar fluxo compartilhado (`requestJson`) para recuperar sessao de forma consistente. | Revisao de codigo + execucao de testes de regressao. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: no maximo 1 chamada extra de refresh por requisicao autenticada falha.
- Seguranca: sem redirecionamento externo; apenas `/login` ou `/admin/login`.
- Confiabilidade: evitar tempestade de refresh concorrente com single-flight.
- Observabilidade: preservar logs atuais; sem remocao de eventos tecnicos existentes.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Access token ausente/expirado e refresh valido | Refresh silencioso + retry da requisicao original com sucesso. |
| ER-02 | Access token ausente/expirado e refresh invalido/revogado | Redirecionar para login da area e lancar erro para o chamador. |
| ER-03 | Request para endpoint de auth (`/api/auth/login|refresh|logout`) retorna 401 | Nao tentar refresh silencioso automatico; manter fluxo de erro atual. |
| ER-04 | Middleware detecta falta de configuracao (`AUTH_CONFIG_MISSING`) | Resposta tecnica JSON `503`, sem redirect. |
| ER-05 | Usuario ja esta em rota de login durante redirecionamento cliente | Anti-loop: nao redirecionar novamente. |

## 10) Dependencias e Restricoes

- Dependencias: `src/middleware.js`, `src/lib/api/http.js`, `AuthSessionContext`, `ScaleRegistrationForm`.
- Restricoes: manter assinatura publica de `requestJson` e contratos de API existentes.

## 11) Suposicoes

- As rotas de login permanecem `/login` e `/admin/login`.
- O helper HTTP e executado no cliente nos fluxos de UI.
- O endpoint `/api/auth/refresh` continua aceitando refresh token via cookie.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-02, T-04 |
| AC-02 | T-02, T-04 |
| AC-03 | T-02, T-04 |
| AC-04 | T-03, T-04 |
| AC-05 | T-03, T-04 |
| AC-06 | T-03, T-04 |
| AC-07 | T-03, T-04 |
| AC-08 | T-03, T-04 |
| AC-09 | T-03, T-04 |
