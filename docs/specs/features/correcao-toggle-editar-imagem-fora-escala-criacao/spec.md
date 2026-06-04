# Spec Funcional - correcao-toggle-editar-imagem-fora-escala-criacao

## 1) Contexto

- Data: 2026-05-14
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, QA

## 2) Problema

Na tela de criacao/edicao de escala, o toggle `Editar imagem` nao pode ser ativado para componentes que nao estao selecionados na escala, embora a regra funcional permita conceder essa permissao para qualquer componente do grupo.

## 3) Objetivo

Permitir ativar `Editar imagem` para componentes especificos do grupo mesmo fora da escala, mantendo `Editar playlist` restrito a componentes selecionados.

## 4) Escopo

- Corrigir o fluxo de toggle de permissao de imagem no formulario `ScaleRegistrationForm`.
- Preservar a regra atual de playlist, que exige componente selecionado na escala.
- Garantir que o payload enviado continue incluindo `imageEditorComponentIds` conforme a selecao do usuario.

## 5) Nao-Escopo

- Alterar regras de autorizacao no backend.
- Alterar layout/estilo do menu de acoes.
- Alterar regras de permissao de playlist.

## 6) Usuarios e Cenarios

- Usuario-alvo: `group-app` que cadastra/edita escalas.
- Cenarios principais:
  - Permitir `Editar imagem` para componente nao selecionado na escala.
  - Continuar impedindo `Editar playlist` para componente nao selecionado.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Ao abrir o menu de um componente fora da escala, o checkbox `Editar imagem` pode ser marcado e desmarcado normalmente. | Teste manual em `ScaleRegistrationForm`. | Alta |
| AC-02 | Ao tentar marcar `Editar playlist` para componente fora da escala, a permissao continua bloqueada. | Teste manual em categoria `louvor`. | Alta |
| AC-03 | O payload de salvamento continua enviando `imageEditorComponentIds` com IDs fora da escala quando selecionados. | Inspecao do objeto `payload` e teste manual de salvar. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: nenhuma chamada adicional de rede.
- Seguranca: backend continua como fonte final de validacao de IDs.
- Acessibilidade: manter controle checkbox acessivel e sem mudanca de label/aria.
- Observabilidade: sem regressao de mensagens de erro existentes.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Componente nao selecionado tenta marcar `Editar playlist`. | Toggle permanece sem alterar estado. |
| ER-02 | Componente nao selecionado marca `Editar imagem`. | Toggle altera estado e valor e preservado no payload. |

## 10) Dependencias e Restricoes

- Dependencias: `ScaleRegistrationForm` e `ComponentActionSheet`.
- Restricoes: manter compatibilidade com comportamento atual de edicao e APIs existentes.

## 11) Suposicoes

- A API ja aceita `imageEditorComponentIds` com componentes do grupo fora da escala.
- O problema atual esta apenas na regra de toggle do frontend.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-01 |
| AC-03 | T-02 |
