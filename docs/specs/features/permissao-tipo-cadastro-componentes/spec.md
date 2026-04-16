# Spec Funcional - permissao-tipo-cadastro-componentes

## 1) Contexto

- Data: 2026-04-15
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Frontend, Backend, QA

## 2) Problema

O cadastro de componente nao possui o campo de tipo de permissao. Sem essa propriedade, o backend nao consegue persistir a audiencia correta por componente e a API nao retorna um contrato completo para controle de acesso futuro.

## 3) Objetivo

Adicionar o campo "tipo de permissao" no cadastro de componente, definir o enum aceito no contrato da API, persistir essa propriedade na colecao `components` e garantir compatibilidade retroativa para componentes antigos sem esse campo.

## 4) Escopo

- Incluir campo "tipo de permissao" na UI de cadastro de componente.
- Definir contrato aceito para o campo com enum: `admin-panel`, `group-app`, `component-app`.
- Atualizar validacao de entrada no backend para aceitar apenas valores do enum.
- Persistir o campo no banco em `components` durante o cadastro.
- Retornar o campo nas respostas de API relacionadas a componentes.
- Tratar compatibilidade retroativa para registros antigos sem `permissionType`.

## 5) Nao-Escopo

- Criacao de novos tipos de permissao fora do enum definido.
- Migracao em massa obrigatoria de dados historicos antes do deploy.
- Refatoracao completa do motor de autorizacao da aplicacao.
- Alteracoes de UX alem do campo necessario no formulario de cadastro.

## 6) Usuarios e Cenarios

- Usuario-alvo:
  - `admin-panel`
  - `group-app`
- Cenarios principais:
  - Usuario cadastra componente e seleciona um tipo de permissao valido.
  - Backend valida o valor recebido e persiste no documento de componente.
  - API retorna componentes novos e antigos sem quebrar contrato de resposta.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | A tela de cadastro de componente exibe o campo "tipo de permissao" com opcoes `admin-panel`, `group-app`, `component-app`. | Teste manual de UI + teste de renderizacao do formulario. | Alta |
| AC-02 | O submit de cadastro envia `permissionType` no payload quando o formulario e valido. | Teste de integracao frontend com mock de requisicao. | Alta |
| AC-03 | A API de cadastro valida `permissionType` contra o enum e rejeita valor invalido com `400`. | Teste de integracao backend com payload valido e invalido. | Alta |
| AC-04 | O backend persiste `permissionType` na colecao `components` e devolve o campo na resposta de criacao. | Teste de integracao com verificacao em banco + contrato de resposta. | Alta |
| AC-05 | Endpoints de leitura de componentes retornam `permissionType` para novos registros e aplicam fallback seguro para registros antigos sem o campo. | Teste de integracao com fixture novo e legado. | Alta |
| AC-06 | A compatibilidade retroativa e mantida: componentes legados sem `permissionType` nao quebram listagem, detalhes ou uso em telas existentes. | Teste manual + integracao ponta a ponta com dados legados. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: impacto maximo de +5% no tempo de resposta de `POST /api/components` e `GET /api/components` no ambiente local.
- Seguranca: validacao server-side obrigatoria do enum; nao aceitar valor arbitrario do cliente.
- Acessibilidade: campo "tipo de permissao" com label associada e navegacao por teclado.
- Observabilidade: logs estruturados para erro de validacao de `permissionType` sem vazar dados sensiveis.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | `permissionType` ausente no cadastro de novo componente | API retorna `400` com mensagem de campo obrigatorio. |
| ER-02 | `permissionType` fora do enum | API retorna `400` com lista de valores aceitos. |
| ER-03 | Registro legado sem `permissionType` em endpoint de leitura | API responde `200` e aplica fallback de compatibilidade (`component-app`) no contrato de saida. |
| ER-04 | Falha de persistencia no banco durante cadastro | API retorna `500` padronizado e frontend mostra erro amigavel. |

## 10) Dependencias e Restricoes

- Dependencias:
  - Formulario de cadastro de componentes existente.
  - Rotas de API de componentes ja ativas no backend.
  - Colecao `components` no banco MongoDB.
- Restricoes:
  - Manter compatibilidade com consumidores atuais da API.
  - Evitar mudanca breaking no payload de resposta de componentes.

## 11) Suposicoes

- O nome de campo adotado sera `permissionType` no backend e no contrato de API.
- Para compatibilidade retroativa, registros antigos sem campo terao fallback logico `component-app` na leitura.
- O formulario de cadastro ja possui infraestrutura de validacao para incluir mais um campo obrigatorio.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-02, T-03 |
| AC-03 | T-04 |
| AC-04 | T-05 |
| AC-05 | T-05, T-06 |
| AC-06 | T-06, T-07 |
