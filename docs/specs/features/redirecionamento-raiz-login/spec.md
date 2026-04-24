# Spec Funcional - redirecionamento-raiz-login

## 1) Contexto

- Data: 2026-04-24
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Engenharia Frontend

## 2) Problema

Ao acessar a URL base (`/`), o usuario permanecia em uma tela de entrada generica em vez de seguir diretamente para o fluxo de autenticacao.

## 3) Objetivo

Garantir que toda navegacao para a rota raiz (`/`) seja redirecionada para `/login`, sem exibir conteudo intermediario.

## 4) Escopo

- Redirecionar acessos a `/` para `/login` no App Router.
- Cobrir o comportamento com teste automatizado de smoke.
- Documentar evidencias de validacao por criterio de aceite.

## 5) Nao-Escopo

- Alterar layout ou conteudo da tela de login.
- Alterar regras de permissao para outras rotas.
- Alterar fluxo de login administrativo (`/admin/login`).

## 6) Usuarios e Cenarios

- Usuario-alvo: usuarios da aplicacao acessando a URL base.
- Cenarios principais:
  - Usuario acessa `/` e e redirecionado para `/login`.
  - Usuario acessa `/login` diretamente e permanece na tela de login.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | A rota raiz (`/`) declara redirecionamento para `/login` no App Router. | Teste automatizado de smoke verificando `redirect('/login')` em `src/app/page.js`. | Alta |
| AC-02 | A rota `/login` continua publica e acessivel sem sessao. | Teste de smoke existente de politicas de rota (`isPublicAuthPath('/login') === true`). | Media |

## 8) Requisitos Nao Funcionais

- Performance: redirecionamento na camada de roteamento, sem renderizacao de tela raiz.
- Seguranca: nenhuma exposicao adicional de dados; comportamento consistente com rota publica de autenticacao.
- Acessibilidade: sem impacto direto (nao ha nova interface).
- Observabilidade: cobertura por teste de smoke para detectar regressao.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Falha de implementacao remove redirecionamento de `/`. | Teste de smoke falha e bloqueia regressao no CI local. |
| ER-02 | Alteracao futura muda destino do redirecionamento. | Teste de smoke detecta ausencia ou destino incorreto de `redirect('/login')`. |

## 10) Dependencias e Restricoes

- Dependencias: Next.js App Router (`next/navigation`) e suite de testes Node (`node:test`).
- Restricoes: manter mudanca enxuta, sem afetar outras rotas.

## 11) Suposicoes

- O fluxo esperado para entrada padrao da aplicacao e iniciar em `/login`.
- O redirecionamento padrao 307 do `redirect()` e aceitavel para o produto.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-03 |
