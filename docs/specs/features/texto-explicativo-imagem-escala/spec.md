# Spec Funcional - texto-explicativo-imagem-escala

## 1) Contexto

- Data: 2026-05-14
- Autor(a): Codex
- Status: Proposed
- Stakeholders: Produto, Frontend, Backend, Lideranca de ministerio

## 2) Problema

A imagem da escala nao possui um campo dedicado para contextualizacao. Isso reduz clareza operacional quando a imagem precisa de explicacao adicional (ex.: orientacoes, observacoes de palco, anotacoes visuais).

## 3) Objetivo

Permitir cadastrar, visualizar e atualizar um texto explicativo vinculado a imagem da escala, aplicando exatamente a mesma regra de permissao ja usada para editar a imagem.

## 4) Escopo

- Adicionar campo de texto explicativo no objeto `imageAttachment`.
- Exibir texto explicativo no bloco de imagem da escala quando houver imagem.
- Permitir editar e salvar o texto explicativo no frontend apenas para perfis com permissao de edicao de imagem.
- Persistir o campo no backend no fluxo de `PATCH` de escala.

## 5) Nao-Escopo

- Criar um sistema de historico/versionamento do texto explicativo.
- Alterar regras de permissao existentes.
- Introduzir novos papeis de autorizacao.

## 6) Usuarios e Cenarios

- Usuario-alvo: lideres e componentes autorizados para editar imagem da escala.
- Cenarios principais:
  - Usuario autorizado adiciona texto explicativo para a imagem da escala.
  - Usuario nao autorizado visualiza o texto, mas nao consegue alterar.
  - Usuario autorizado atualiza o texto explicativo sem trocar a imagem.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | O painel de imagem exibe um campo de texto explicativo quando existe imagem vinculada. | Teste manual na tela de escalas. | Alta |
| AC-02 | Apenas perfis com permissao de editar imagem conseguem alterar e salvar o texto explicativo. | Teste manual com perfil autorizado e nao autorizado. | Alta |
| AC-03 | A persistencia do texto explicativo usa o mesmo fluxo/autorizacao da edicao de imagem (`imageAttachment`). | Revisao de codigo backend + teste manual de PATCH. | Alta |
| AC-04 | O texto explicativo salvo permanece ao recarregar a tela e aparece nas respostas da API. | Teste manual de recarga + inspeção de payload. | Media |

## 8) Requisitos Nao Funcionais

- Performance: salvar o texto deve reutilizar chamada existente de PATCH sem impacto perceptivel adicional.
- Seguranca: manter validacao e autorizacao atuais do endpoint de imagem.
- Acessibilidade: textarea e botao com `label`, estados `disabled` e foco visivel.
- Observabilidade: manter mensagens de feedback de sucesso/erro no card.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Usuario sem permissao tenta salvar texto explicativo | Bloquear acao e exibir feedback de permissao negada. |
| ER-02 | Falha de API ao salvar texto | Exibir erro e manter texto digitado para nova tentativa. |
| ER-03 | Escala sem imagem vinculada | Campo de texto explicativo nao aparece para edicao. |

## 10) Dependencias e Restricoes

- Dependencias:
  - `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
  - `src/components/organisms/ScaleFeed/ScaleFeed.module.css`
  - `src/lib/scales/imageAttachment.js`
- Restricoes:
  - Reaproveitar o contrato atual de `imageAttachment` no backend.
  - Nao quebrar compatibilidade com registros sem texto explicativo.

## 11) Suposicoes

- O campo explicativo sera armazenado como string curta/media no proprio `imageAttachment`.
- O fluxo de permissao atual de imagem ja cobre a necessidade de autorizacao deste campo.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-02 |
| AC-02 | T-02, T-03 |
| AC-03 | T-01, T-03 |
| AC-04 | T-01, T-02, T-04 |
