# Spec Funcional - ajuste-permissao-padrao-cadastro-componentes

## 1) Contexto

- Data: 2026-04-24
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Frontend, QA

## 2) Problema

Na tela de cadastro de componentes, o tipo de permissao inicia sem selecao e as opcoes sao exibidas com identificadores tecnicos (`component-app` e `group-app`), o que aumenta atrito para o usuario e dificulta entendimento imediato do papel de cada opcao.

## 3) Objetivo

Reduzir atrito no cadastro de componentes definindo `component-app` como valor padrao do select de tipo de permissao e exibindo labels amigaveis para as opcoes (`Componente` e `Organizador`).

## 4) Escopo

- Definir `component-app` como valor inicial no cadastro de componente (novo registro).
- Ajustar reset do formulario para manter `component-app` como valor selecionado.
- Atualizar labels do select para termos amigaveis sem alterar os valores persistidos no payload.

## 5) Nao-Escopo

- Alterar contrato de API para novos tipos de permissao.
- Alterar fluxo de autorizacao no backend.
- Alterar telas fora de cadastro/edicao de componentes.

## 6) Usuarios e Cenarios

- Usuario-alvo: perfil com audiencia `group-app` que cadastra/edita componentes.
- Cenarios principais:
  - Abrir tela de cadastro de componente e visualizar permissao padrao selecionada como Componente.
  - Alterar manualmente para Organizador quando necessario.
  - Salvar mantendo os valores tecnicos esperados no backend.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Ao abrir cadastro de novo componente, o select de tipo de permissao deve iniciar com `component-app` selecionado. | Teste manual na tela de cadastro de componente. | Alta |
| AC-02 | As opcoes do select devem exibir labels amigaveis: `Componente` para `component-app` e `Organizador` para `group-app`. | Teste manual de UI inspecionando o select. | Alta |
| AC-03 | O envio do formulario deve continuar enviando os valores tecnicos (`component-app`/`group-app`) sem regressao no payload. | Revisao de codigo e teste manual de submit com inspecao de request. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: sem impacto perceptivel no carregamento do formulario.
- Seguranca: sem alteracao de regras de autorizacao e validacao server-side.
- Acessibilidade: manter label associada ao campo e navegacao por teclado no select.
- Observabilidade: sem novos logs necessarios por ser ajuste de apresentacao e estado inicial do formulario.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Usuario altera permissao para Organizador antes de salvar | Formulario deve respeitar a escolha e enviar `group-app` no payload. |
| ER-02 | Formulario e resetado apos cadastro com sucesso | Campo deve retornar ao padrao `component-app` para novo cadastro. |

## 10) Dependencias e Restricoes

- Dependencias: componente `ComponentRegistrationForm` e contrato atual da API `/api/components`.
- Restricoes: nao mudar enum/valores tecnicos aceitos no backend.

## 11) Suposicoes

- `component-app` representa o perfil padrao desejado para novos componentes.
- Termo amigavel `Organizador` corresponde a `group-app` para a regra de negocio atual.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-02 |
| AC-03 | T-03 |
