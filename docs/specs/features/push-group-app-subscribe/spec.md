# Spec Funcional - push-group-app-subscribe

## 1) Contexto

- Data: 2026-04-29
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, Backend

## 2) Problema

Usuarios autenticados com audiencia `group-app` nao entram no fluxo de ativacao de push no cliente e tambem nao conseguem registrar subscription no endpoint de backend.

## 3) Objetivo

Permitir que usuarios `group-app` tambem possam ativar e registrar notificacoes push, com o mesmo fluxo ja existente para `component-app`.

## 4) Escopo

- Ajustar elegibilidade de push no cliente para incluir `group-app`.
- Ajustar endpoint `/api/push/subscribe` para aceitar audiencia `group-app`.
- Garantir resolucao robusta do documento de componente da sessao ao salvar subscription.

## 5) Nao-Escopo

- Alterar regras de disparo de notificacoes por escala.
- Criar novo provider de push.

## 6) Usuarios e Cenarios

- Usuario-alvo: perfis autenticados `component-app` e `group-app`.
- Cenarios principais:
  - `group-app` com permissao `default` concede permissao e registra subscription.
  - `group-app` com permissao `granted` conclui ativacao sem prompt.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | O cliente considera `group-app` elegivel para ativacao push automatica e manual. | Validacao de codigo + teste manual em sessao `group-app`. | Alta |
| AC-02 | O endpoint `/api/push/subscribe` aceita `group-app` autenticado e persiste subscription valida. | Validacao de codigo + chamada HTTP autenticada. | Alta |
| AC-03 | O fluxo legado de `component-app` permanece funcional sem regressao. | Validacao de codigo + smoke manual. | Alta |

## 8) Requisitos Nao Funcionais

- Seguranca: manter validacao de sessao e escopo por `groupId`.
- Confiabilidade: falhas de push nao devem afetar autenticacao.
- Observabilidade: manter mensagens de erro e codigos atuais do endpoint.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Sessao sem audiencia permitida para subscribe | Resposta 403 de autorizacao. |
| ER-02 | Subscription invalida | Resposta 400 sem persistencia. |
| ER-03 | Componente da sessao nao encontrado no grupo | Resposta 404 sem persistencia. |

## 10) Dependencias e Restricoes

- Dependencias: Auth session, colecao `components`, Service Worker `/push-sw.js`.
- Restricoes: manter contrato atual das rotas e formato de resposta.

## 11) Suposicoes

- Usuarios `group-app` existem na colecao `components` com `_id` igual ao `session.user.id`.
- O fluxo de disparo ja consome `pushSubscriptions` desses documentos quando aplicavel.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-03 |
| AC-03 | T-04 |
