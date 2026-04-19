# Spec Funcional - cadastro-edicao-grupos-admin

## 1) Contexto

- Data: 2026-04-19
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, Backend, Administracao

## 2) Problema

A visao administrativa listava grupos, mas nao possuia fluxo completo de cadastro e edicao com as configuracoes iniciais equivalentes ao `group-app`, nem permitia definir um usuario gestor inicial com perfil `group-app` para operar o grupo apos a criacao.

## 3) Objetivo

Entregar fluxo administrativo completo para criar e editar grupos com:
- identidade do grupo (nome, status, foto);
- configuracoes iniciais de `group-app` (tema, funcoes disponiveis e funcoes customizadas);
- cadastro/edicao de usuario gestor inicial com permissao `group-app`.

## 4) Escopo

- Criar APIs administrativas para cadastro, leitura e edicao de grupos.
- Persistir dados em `groups`, `group_settings` e `components` (gestor `group-app`).
- Criar tela de cadastro de grupo em `/admin/grupos/novo`.
- Criar tela de edicao de grupo em `/admin/grupos/[groupId]/editar`.
- Atualizar listagem `/admin/grupos` com atalhos de novo cadastro e edicao.
- Manter menu admin com atalho de criacao para o novo fluxo.

## 5) Nao-Escopo

- CRUD completo de multiplos gestores por grupo.
- Convite por email/SMS para ativacao de gestor.
- Politicas avancadas de senha (complexidade/expiracao).

## 6) Usuarios e Cenarios

- Usuario-alvo:
  - Administrador (`admin-panel`).
- Cenarios principais:
  - Admin cadastra um grupo com tema/funcoes iniciais e define gestor `group-app`.
  - Admin edita dados do grupo e do gestor sem recriar o grupo.
  - Admin altera senha do gestor opcionalmente na edicao.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Existe endpoint `POST /api/admin/groups` que cria grupo, configuracoes iniciais e gestor `group-app`. | Teste de integracao/manual com payload valido. | Alta |
| AC-02 | Existe endpoint `GET /api/admin/groups/[groupId]` para carregar dados de edicao (grupo + settings + gestor). | Chamada autenticada por admin retornando `item` completo. | Alta |
| AC-03 | Existe endpoint `PATCH /api/admin/groups/[groupId]` para editar grupo, configuracoes e gestor. | Teste manual de alteracao e reconsulta. | Alta |
| AC-04 | Tela `/admin/grupos/novo` permite preencher e salvar identidade, configuracoes iniciais e gestor. | Teste manual com redirecionamento para tela de edicao apos cadastro. | Alta |
| AC-05 | Tela `/admin/grupos/[groupId]/editar` carrega dados existentes e salva alteracoes. | Teste manual de leitura e atualizacao. | Alta |
| AC-06 | Listagem `/admin/grupos` possui CTA `Novo grupo` e acao `Editar grupo` por item. | Teste visual/manual de navegacao. | Media |
| AC-07 | Validacoes impedem salvar dados invalidos (nome de grupo, funcoes e gestor sem campos obrigatorios). | Teste manual com payload/formulario invalido. | Alta |

## 8) Requisitos Nao Funcionais

- Seguranca: endpoints restritos a `admin-panel`.
- Consistencia: manter padrao de schema usado no app para `groups`, `group_settings` e `components`.
- UX: fluxo admin deve oferecer feedback de erro/sucesso ao salvar.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | `groupId` inexistente na tela/endpoint de edicao | Retornar `404` na API e tela de fallback para grupo nao encontrado. |
| ER-02 | Username de gestor duplicado | Retornar `409 CONFLICT` com mensagem amigavel. |
| ER-03 | Payload invalido (nome curto, sem funcao selecionada, senha inicial vazia) | Retornar `400 BAD_REQUEST` com orientacao de correcao. |
| ER-04 | Falha em persistencia (MongoDB indisponivel) | Retornar `500` com mensagem de indisponibilidade. |

## 10) Dependencias e Restricoes

- Dependencias: `getMongoCollections`, auth JWT existente, `createPasswordHash`, `parseComponentPhotoInput`.
- Restricoes: manter compatibilidade com o login atual baseado em `components`.

## 11) Suposicoes

- O primeiro gestor `group-app` e representado por um registro na collection `components` com `permissionType: 'group-app'`.
- O login de gestor sera realizado via `username` e senha definidos nesse cadastro.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-02 |
| AC-03 | T-03 |
| AC-04 | T-04 |
| AC-05 | T-04 |
| AC-06 | T-05 |
| AC-07 | T-01, T-03, T-04 |
