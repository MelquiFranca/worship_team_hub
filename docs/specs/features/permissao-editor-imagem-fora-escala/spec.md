# Spec Funcional - permissao-editor-imagem-fora-escala

## 1) Contexto

- Data: 2026-04-24
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Backend, Frontend, QA

## 2) Problema

A permissao de edicao de imagem da escala exige que o usuario autorizado tambem faca parte dos componentes escalados. Isso impede delegar a manutencao da imagem para um componente especifico do grupo que nao esta participando da escala.

## 3) Objetivo

Permitir conceder permissao de edicao de imagem para um componente especifico do mesmo grupo, mesmo quando ele nao faz parte da escala, mantendo as regras atuais de playlist inalteradas.

## 4) Escopo

- Ajustar validacao de `imageEditorComponentIds` no backend para aceitar componentes do grupo fora da escala.
- Manter `playlistEditorComponentIds` restrito aos componentes escalados.
- Ajustar autorizacao de edicao de imagem para `component-app` com base no `id` do usuario autenticado.
- Ajustar formulario de cadastro/edicao para selecionar editores de imagem fora da escala.
- Ajustar feed de escalas para permitir edicao de imagem por usuario autorizado nao participante.

## 5) Nao-Escopo

- Alterar regras de permissao da playlist da escala.
- Criar permissao com expiracao automatica.
- Implementar trilha de auditoria detalhada de alteracao de imagem.

## 6) Usuarios e Cenarios

- Usuario-alvo:
  - `group-app`: define permissoes da escala.
  - `component-app`: edita imagem quando autorizado.
- Cenarios principais:
  - Lider concede permissao de editar imagem para componente do grupo nao escalado.
  - Componente autorizado (nao participante) consegue editar/remover/upload da imagem da escala.
  - Componente sem permissao continua bloqueado para editar imagem.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | API de cadastro/edicao de escala aceita `imageEditorComponentIds` com componentes do grupo que nao estao em `components` da escala. | Teste manual de `POST/PATCH /api/scales` com IDs validos fora da escala. | Alta |
| AC-02 | API rejeita `imageEditorComponentIds` com IDs inexistentes ou de outro grupo. | Teste manual de `POST/PATCH /api/scales` com IDs invalidos e resposta `400`. | Alta |
| AC-03 | `component-app` autorizado em `imageEditorComponentIds` consegue atualizar `imageAttachment` mesmo sem estar em `scale.components`. | Teste manual de `PATCH /api/scales/[scaleId]` com sessao `component-app` autorizada. | Alta |
| AC-04 | Formulario de cadastro/edicao permite marcar editores de imagem fora da escala e preserva essa selecao ao editar escala existente. | Teste manual em `ScaleRegistrationForm`. | Alta |
| AC-05 | No feed, usuario `component-app` autorizado fora da escala consegue editar imagem; usuario nao autorizado continua bloqueado. | Teste manual em `ScaleFeed`, aba imagens. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: manter consultas de validacao enxutas e sem leituras redundantes.
- Seguranca: validar no servidor existencia e escopo de grupo dos IDs informados.
- Acessibilidade: manter estados `disabled`, labels e mensagens de feedback coerentes.
- Observabilidade: manter mensagens de erro explicitas para permissao invalida.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | `imageEditorComponentIds` com ID inexistente | API retorna `400 BAD_REQUEST` com mensagem orientativa. |
| ER-02 | `component-app` sem permissao de imagem tenta editar `imageAttachment` | API retorna `403 FORBIDDEN`. |
| ER-03 | Usuario remove componente da escala que tinha permissao de imagem | Permissao de imagem pode permanecer valida se o componente continuar no grupo. |
| ER-04 | Lista de componentes nao carregada no formulario | UI nao permite submit inconsistente e exibe estado de erro/carregamento. |

## 10) Dependencias e Restricoes

- Dependencias: endpoints `/api/scales`, `/api/scales/[scaleId]`, `ScaleRegistrationForm`, `ScaleFeed`.
- Restricoes: manter compatibilidade com dados existentes e sem migracao de schema.

## 11) Suposicoes

- `session.user.id` de `component-app` corresponde ao `_id` do componente no grupo.
- IDs em `imageEditorComponentIds` sao sempre strings normalizadas pelo backend.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-01, T-02 |
| AC-03 | T-02 |
| AC-04 | T-03 |
| AC-05 | T-04 |
