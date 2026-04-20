# Spec Funcional - perfil-edicao-foto-senha

## 1) Contexto

- Data: 2026-04-20
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, Backend, QA

## 2) Problema

A rota `/editar-perfil` estava em modo fallback e nao permitia manutencao real de dados da conta. Usuarios nao conseguiam atualizar foto de perfil nem trocar senha no proprio fluxo autenticado.

## 3) Objetivo

Permitir que qualquer usuario autenticado (`admin-panel`, `group-app`, `component-app`) edite foto de perfil e altere senha com validacoes de seguranca e persistencia.

## 4) Escopo

- Criar API autenticada `GET/PATCH /api/auth/profile`.
- Expor dados de perfil atual (id, nome, identificador, role, audience, groupId, foto).
- Permitir upload/remocao de foto com o mesmo contrato de `photoDataUrl/photoUrl/photoProvided`.
- Permitir troca de senha com `currentPassword` e `newPassword`.
- Persistir alteracoes para usuarios de `components` e para usuarios seed via override.
- Substituir fallback de `/editar-perfil` por formulario funcional.

## 5) Nao-Escopo

- Edicao de nome/identificador da conta.
- Fluxo de recuperacao de senha por email.
- Recorte/edicao avancada de imagem.
- Historico de alteracoes de perfil.

## 6) Usuarios e Cenarios

- Usuario-alvo: qualquer usuario logado no app.
- Cenarios principais:
  - Usuario abre `/editar-perfil` e visualiza dados atuais.
  - Usuario envia nova foto e salva.
  - Usuario remove foto atual e salva.
  - Usuario informa senha atual, nova senha e confirmacao e conclui troca.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | `GET /api/auth/profile` retorna perfil autenticado para as 3 audiencias permitidas. | Teste manual/API com sessao valida. | Alta |
| AC-02 | `PATCH /api/auth/profile` atualiza foto de perfil usando o contrato de foto ja adotado no projeto. | Teste manual com upload/remocao de foto. | Alta |
| AC-03 | `PATCH /api/auth/profile` atualiza senha somente quando senha atual for valida. | Teste manual/API com senha atual valida/invalida. | Alta |
| AC-04 | Usuarios seed continuam autenticando com senha nova apos alteracao. | Login manual apos troca de senha de seed user. | Alta |
| AC-05 | Tela `/editar-perfil` mostra feedback de sucesso/erro e validacoes de formulario. | Teste manual da UX na tela. | Media |

## 8) Requisitos Nao Funcionais

- Performance: operacoes de perfil sem recarga completa da aplicacao.
- Seguranca: validacao de senha atual obrigatoria para troca de senha.
- Acessibilidade: labels, estados de loading e mensagens de erro legiveis.
- Observabilidade: erros de API retornados em formato padrao (`jsonApiError`/auth errors).

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Requisicao sem sessao valida | Retornar 401/403 conforme regra de auth. |
| ER-02 | `currentPassword` invalida | Bloquear alteracao e retornar erro de validacao. |
| ER-03 | `newPassword` vazia | Bloquear alteracao e retornar erro de validacao. |
| ER-04 | `photoDataUrl` invalida ou acima do limite | Bloquear alteracao e retornar erro de validacao. |

## 10) Dependencias e Restricoes

- Dependencias: `loadAuthUsers`, `parseComponentPhotoInput`, camada MongoDB, `AuthSessionContext`.
- Restricoes: manter compatibilidade com usuarios seed definidos em `src/data/authUsers.js`.

## 11) Suposicoes

- Usuario autenticado sempre possui `id` valido no token de acesso.
- Colecao `components` ja e fonte de verdade para usuarios component/app.
- Persistencia de override para seed users pode usar colecao dedicada.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-03, T-05 |
| AC-03 | T-03, T-04 |
| AC-04 | T-04 |
| AC-05 | T-05 |
