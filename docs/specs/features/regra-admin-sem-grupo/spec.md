# Spec Funcional - regra-admin-sem-grupo

## 1) Contexto

- Data: 2026-04-21
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Backend, Seguranca, Administracao

## 2) Problema

Usuarios com permissao da visao administrativa (`admin-panel`) podiam manter vinculo de `groupId`, gerando inconsistencias com a regra de negocio de que administradores nao pertencem a grupos.

## 3) Objetivo

Garantir que qualquer usuario administrativo seja persistido e resolvido sem grupo associado (`groupId: null`) em criacao, edicao e autenticacao.

## 4) Escopo

- Normalizar `groupId` para `null` quando `permissionType = admin-panel` no cadastro de componentes.
- Normalizar `groupId` para `null` quando houver edicao de permissao para `admin-panel`.
- Aceitar usuario admin sem grupo no carregamento de usuarios de autenticacao.
- Manter comportamento atual para `group-app` e `component-app`.

## 5) Nao-Escopo

- Migracao automatica de dados legados no banco.
- Alteracoes de UI/formulario de cadastro de componente.
- Mudancas no modelo de papeis alem dos existentes.

## 6) Usuarios e Cenarios

- Usuario-alvo:
  - Administrador da plataforma
  - Lider de grupo que gerencia componentes
- Cenarios principais:
  - Cadastro de usuario com permissao `admin-panel` resulta em `groupId: null`.
  - Edicao de usuario existente para `admin-panel` remove vinculo de grupo.
  - Login/sessao de admin carregada sem exigir `groupId`.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | `POST /api/components` salva e retorna `groupId: null` quando `permissionType = admin-panel`. | Teste de integracao da rota + inspecao de payload serializado. | Alta |
| AC-02 | `PATCH /api/components/[componentId]` ao definir `permissionType = admin-panel` atualiza `groupId` para `null`. | Teste de integracao da rota de edicao. | Alta |
| AC-03 | `loadAuthUsers` permite mapear usuario admin sem `groupId` e publica `groupId: null` no auth user. | Teste unitario/integracao do carregamento de usuarios. | Alta |
| AC-04 | Usuarios nao admin continuam com regra atual de grupo (sem regressao funcional). | Teste de regressao em criacao/edicao de `group-app` e `component-app`. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: sem consultas adicionais ao banco alem das ja existentes no fluxo.
- Seguranca: coerencia entre regra de negocio e dados persistidos para evitar privilegios ambiguos.
- Acessibilidade: sem impacto (mudanca apenas backend).
- Observabilidade: erros de validacao e conflitos continuam com codigos HTTP ja padronizados.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Cadastro/edicao com `permissionType` invalido | `400 BAD_REQUEST` com mensagem de validacao existente. |
| ER-02 | Colisao de username no mesmo escopo logico | `409 CONFLICT` sem alterar dados existentes. |
| ER-03 | Usuario admin legado ainda com `groupId` salvo | Fluxos novos passam a normalizar `groupId` para `null`; migracao historica fica fora deste escopo. |

## 10) Dependencias e Restricoes

- Dependencias:
  - Rotas `src/app/api/components/route.js` e `src/app/api/components/[componentId]/route.js`.
  - Carregador `src/lib/auth/userSource.js`.
- Restricoes:
  - Compatibilidade com validacoes e mensagens ja usadas nas APIs.

## 11) Suposicoes

- `admin-panel` representa usuario administrativo global, sem escopo de grupo.
- `group-app` e `component-app` devem continuar obrigatoriamente ligados a grupo.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-02 |
| AC-03 | T-03 |
| AC-04 | T-04 |
