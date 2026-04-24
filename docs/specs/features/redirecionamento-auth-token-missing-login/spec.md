# Spec Funcional - redirecionamento-auth-token-missing-login

## 1) Contexto

- Data: 2026-04-24
- Autor(a): Codex (GPT-5)
- Status: Implemented
- Stakeholders: Frontend (app/admin), API/auth

## 2) Problema

Quando o cliente recebe erro de autenticacao com `status 401` e codigo `AUTH_TOKEN_MISSING`, o fluxo atual apenas lanca erro. O usuario pode permanecer em rota protegida sem redirecionamento automatico para a tela de login adequada.

## 3) Objetivo

Garantir redirecionamento automatico no cliente para a tela de login correta quando a API responder `401` com `AUTH_TOKEN_MISSING`, mantendo comportamento atual para os demais erros.

## 4) Escopo

- Tratar de forma central no helper HTTP do cliente (`requestJson`) a condicao `401 + AUTH_TOKEN_MISSING`.
- Redirecionar para `/login` em contexto app.
- Redirecionar para `/admin/login` em contexto admin protegido (`/admin` e `/admin/*`, exceto tela de login).
- Evitar loop de redirect quando a rota atual ja for `/login` ou `/admin/login`.
- Cobrir comportamento com testes unitarios do helper HTTP.

## 5) Nao-Escopo

- Alterar middleware de autenticacao no servidor.
- Alterar comportamento de codigos de erro diferentes de `AUTH_TOKEN_MISSING`.
- Alterar UX de mensagens de erro exibidas pelos componentes.

## 6) Usuarios e Cenarios

- Usuario-alvo: usuarios finais da area app e usuarios administrativos da area admin.
- Cenarios principais:
  - Usuario em rota protegida app recebe `401 + AUTH_TOKEN_MISSING` e e redirecionado para `/login`.
  - Usuario em rota protegida admin recebe `401 + AUTH_TOKEN_MISSING` e e redirecionado para `/admin/login`.
  - Usuario ja em rota de login nao entra em loop de redirecionamento.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | O helper HTTP redireciona para `/login` quando a resposta for `401` com codigo `AUTH_TOKEN_MISSING` em rota nao-admin. | Teste unitario com `window.location.pathname` de area app + mock de resposta HTTP. | Alta |
| AC-02 | O helper HTTP redireciona para `/admin/login` quando a resposta for `401` com codigo `AUTH_TOKEN_MISSING` em rota admin protegida. | Teste unitario com `window.location.pathname` em `/admin/...` + mock de resposta HTTP. | Alta |
| AC-03 | O helper HTTP nao dispara redirecionamento quando o usuario ja estiver em `/login` ou `/admin/login`. | Teste unitario garantindo ausencia de chamada de redirect nas duas rotas de login. | Alta |
| AC-04 | Para erros diferentes de `401 + AUTH_TOKEN_MISSING`, o comportamento existente e preservado (sem redirect adicional e com throw de erro). | Teste unitario com `401` de outro codigo e verificacao de erro lancado sem redirect. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: sem chamadas extras de rede; apenas avaliacao local de status/codigo/pathname.
- Seguranca: redirecionar somente para caminhos internos predefinidos (`/login`, `/admin/login`).
- Acessibilidade: sem impacto direto em semantica de UI.
- Observabilidade: sem mudanca de telemetria nesta feature.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | `401` com codigo diferente de `AUTH_TOKEN_MISSING` | Nao redirecionar automaticamente; manter throw com mensagem existente. |
| ER-02 | `401 + AUTH_TOKEN_MISSING` em `/login` ou `/admin/login` | Nao redirecionar novamente (anti-loop). |
| ER-03 | Execucao sem `window` (SSR/testes server-side) | Nao tentar navegar; manter comportamento de throw de erro. |

## 10) Dependencias e Restricoes

- Dependencias: helper `src/lib/api/http.js`; runtime com `fetch` no cliente.
- Restricoes: alterar apenas arquivos permitidos no ownership da solicitacao.

## 11) Suposicoes

- O contexto da area (app/admin) pode ser inferido de `window.location.pathname` no cliente.
- O codigo de erro pode chegar em `payload.code` ou campos equivalentes ja aceitos pelo helper.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-02, T-03 |
| AC-02 | T-02, T-03 |
| AC-03 | T-02, T-03 |
| AC-04 | T-02, T-03, T-04 |
