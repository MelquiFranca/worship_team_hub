# Spec Funcional - auth-nao-mascarar-indisponibilidade-mongo

## 1) Contexto

- Data: 2026-04-24
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Backend, Suporte

## 2) Problema

Quando a leitura de usuarios de autenticacao falha por indisponibilidade de MongoDB, o fluxo atual retorna lista vazia de usuarios e o login responde `AUTH_CREDENTIALS_INVALID`. Isso mascara erro de infraestrutura como erro de credencial.

## 3) Objetivo

Retornar erro de autenticacao de dependencia indisponivel (`AUTH_DEPENDENCY_UNAVAILABLE`, HTTP 503) quando o carregamento de usuarios falhar por indisponibilidade/configuracao de persistencia.

## 4) Escopo

- Ajustar `loadAuthUsers` para nao silenciar erro de persistencia.
- Garantir resposta de auth tipada para login/refresh/me/profile quando houver falha de dependencia.
- Adicionar teste automatizado para o comportamento novo.

## 5) Nao-Escopo

- Alterar UX/texto do frontend de login.
- Implementar retry ou circuit breaker para MongoDB.
- Alterar modelo de dados de componentes/grupos.

## 6) Usuarios e Cenarios

- Usuario-alvo: usuario final tentando autenticar e equipe de suporte operando incidentes.
- Cenarios principais:
  - MongoDB indisponivel durante login.
  - MongoDB nao configurado no ambiente.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Falha ao carregar usuarios de auth nao deve retornar lista vazia silenciosa. | Teste unitario de `loadAuthUsers` sem `MONGODB_URI`. | Alta |
| AC-02 | Falha de dependencia no carregamento deve produzir `AUTH_DEPENDENCY_UNAVAILABLE` com status 503. | Teste unitario da excecao retornada por `loadAuthUsers`. | Alta |
| AC-03 | Rotas de auth que usam `loadAuthUsers` devem continuar tratando erro tipado via `isAuthError`. | Validacao estatica dos handlers (`login`, `refresh`, `me`, `profile`). | Media |

## 8) Requisitos Nao Funcionais

- Performance: sem impacto relevante (tratamento apenas em caminho de erro).
- Seguranca: nao expor segredo ou stack detalhada no payload de erro.
- Acessibilidade: nao aplicavel (backend).
- Observabilidade: codigo de erro deve distinguir falha de credencial de falha de dependencia.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | MongoDB indisponivel durante load de usuarios | `AUTH_DEPENDENCY_UNAVAILABLE` (503) |
| ER-02 | MongoDB nao configurado (sem URI) | `AUTH_DEPENDENCY_UNAVAILABLE` (503) |

## 10) Dependencias e Restricoes

- Dependencias: `src/lib/db/mongodb.js`, `src/lib/auth/errors.js`.
- Restricoes: manter compatibilidade com contratos atuais de payload de erro de auth.

## 11) Suposicoes

- Rotas de auth ja convertem `AuthError` com `toAuthErrorResponse`.
- `AUTH_DEPENDENCY_UNAVAILABLE` ja e codigo valido no dominio de auth.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-03 |
| AC-02 | T-01, T-03 |
| AC-03 | T-02 |
