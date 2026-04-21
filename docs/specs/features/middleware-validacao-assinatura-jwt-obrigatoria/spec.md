# Spec Funcional - middleware-validacao-assinatura-jwt-obrigatoria

## 1) Contexto

- Data: 2026-04-21
- Autor(a): Codex
- Status: Draft
- Stakeholders: Backend, Seguranca, Plataforma

## 2) Problema

O middleware pode aceitar token sem validar assinatura quando faltam segredo/chaves. Esse bypass compromete a autenticidade do token e permite acesso indevido a rotas protegidas.

## 3) Objetivo

Garantir validacao criptografica obrigatoria de assinatura JWT em todas as rotas protegidas, sem caminho de sucesso quando configuracao de chave estiver ausente ou invalida.

## 4) Escopo

- Remover qualquer `return true`/bypass em ausencia de segredo/chave no middleware.
- Tornar obrigatoria verificacao de assinatura, expiracao e claims essenciais para tokens.
- Padronizar respostas de erro (`401` para token invalido, `503` para misconfiguracao).
- Cobrir matriz de testes de middleware para cenarios validos e invalidos.

## 5) Nao-Escopo

- Refatoracao completa de todas as policies de autorizacao por role.
- Mudanca de provedor de identidade.
- Implementacao de SSO.

## 6) Usuarios e Cenarios

- Usuario-alvo: usuarios autenticados (admin, group owner, component) e time de seguranca.
- Cenarios principais:
  - Token assinado corretamente acessa rota protegida.
  - Token adulterado ou com assinatura invalida e bloqueado.
  - Middleware sem chave configurada responde erro de servico, nunca autoriza.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Middleware sempre valida assinatura JWT antes de autorizar acesso a rota protegida. | Teste de integracao com token valido e token adulterado. | Alta |
| AC-02 | Ausencia de segredo/chave no middleware nunca resulta em autorizacao; resposta deve ser `503` com codigo de config. | Teste de integracao sem env de chave. | Alta |
| AC-03 | Token invalido, expirado ou malformado retorna `401` com codigo de erro padronizado. | Teste de contrato de erro do middleware. | Alta |
| AC-04 | Token valido com assinatura correta e claims obrigatorias passa no middleware. | Teste de integracao em rota protegida. | Alta |
| AC-05 | Existem testes automatizados cobrindo os fluxos de bypass previamente identificados. | Execucao de suite de testes de middleware/auth. | Media |

## 8) Requisitos Nao Funcionais

- Performance: sobrecarga p95 de validacao no middleware <= 30ms em ambiente local de referencia.
- Seguranca: proibido caminho permissivo sem validacao de assinatura.
- Acessibilidade: mensagens de erro de API em formato consistente para consumo de clientes.
- Observabilidade: logs de `auth_signature_invalid`, `auth_token_expired`, `auth_config_invalid` com contexto minimo.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | JWT sem assinatura valida | `401 Unauthorized` com `AUTH_TOKEN_INVALID`. |
| ER-02 | JWT expirado | `401 Unauthorized` com `AUTH_TOKEN_EXPIRED`. |
| ER-03 | JWT malformado | `401 Unauthorized` com `AUTH_TOKEN_MALFORMED`. |
| ER-04 | Chave/segredo ausente no middleware | `503 Service Unavailable` com `AUTH_CONFIG_MISSING`. |
| ER-05 | Erro interno de verificacao criptografica | `401` padronizado + log tecnico sem segredo. |

## 10) Dependencias e Restricoes

- Dependencias: servico JWT, modulo de configuracao de auth, middleware central.
- Restricoes: manter compatibilidade de contrato de sucesso para tokens validos.

## 11) Suposicoes

- O middleware atual e ponto unico de entrada para rotas protegidas previstas no escopo.
- Endpoints criticos ja dependem de token JWT como credencial principal.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-02, T-03 |
| AC-03 | T-03, T-04 |
| AC-04 | T-01, T-04 |
| AC-05 | T-05 |
