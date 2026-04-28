# Spec Funcional - filtro-escalas-usuario-logado

## 1) Contexto

- Data: 2026-04-28
- Autor(a): Codex (GPT-5)
- Status: Draft
- Stakeholders: Produto, Frontend, usuarios autenticados da tela de escalas

## 2) Problema

Na tela de escalas, o usuario nao consegue filtrar rapidamente apenas as escalas em que esta escalado. Alem disso, quando visualiza todas as escalas, nao ha destaque claro dos cards em que o usuario participa.

## 3) Objetivo

Permitir filtrar “somente escalas em que estou escalado” e, quando esse filtro estiver desligado, destacar no cabecalho os cards das escalas em que o usuario logado participa.

## 4) Escopo

- Adicionar controle de filtro na tela de escalas para exibir apenas escalas com participacao do usuario logado.
- Aplicar o filtro no client sobre as escalas carregadas.
- Destacar visualmente o cabecalho do card quando o usuario logado estiver escalado e o filtro de “somente minhas escalas” estiver desligado.
- Manter o filtro de periodo existente (Hoje e futuras/Todas) funcionando sem alteracao de comportamento.

## 5) Nao-Escopo

- Alteracoes no endpoint `/api/scales` para filtrar por usuario no backend.
- Mudancas em regras de permissao de edicao/notificacao/comentarios.
- Alteracoes em outros modulos fora da tela de escalas.

## 6) Usuarios e Cenarios

- Usuario-alvo: usuario autenticado (admin ou componente) que acessa a tela de escalas.
- Cenarios principais:
  - Ativar filtro “somente minhas escalas” e visualizar apenas escalas com sua participacao.
  - Manter filtro desligado e identificar facilmente suas escalas pelo destaque no cabecalho do card.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | A tela de escalas deve exibir um novo filtro para “somente minhas escalas”, iniciado como habilitado por padrao. | Teste manual na UI com sessao autenticada. | Alta |
| AC-02 | Com o filtro “somente minhas escalas” ativo, somente cards de escalas com participacao do usuario logado devem ser exibidos. | Teste manual alternando filtro com usuario presente e ausente em escalas. | Alta |
| AC-03 | Com o filtro “somente minhas escalas” inativo, os cards em que o usuario logado participa devem ter destaque visual no cabecalho. | Teste manual comparando cards com e sem participacao do usuario. | Alta |
| AC-04 | O filtro de periodo existente deve continuar funcionando em conjunto com o novo filtro, sem regressao visivel. | Teste manual combinando periodo + novo filtro. | Media |

## 8) Requisitos Nao Funcionais

- Performance: filtragem local em memoria sem requisicoes adicionais ao alternar “somente minhas escalas”.
- Seguranca: sem mudanca de superficie de autenticacao/autorizacao; apenas uso da sessao existente no client.
- Acessibilidade: novo controle deve possuir rotulo legivel e estado claro.
- Observabilidade: feedback visual consistente sem necessidade de novos logs.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Sessao ainda nao carregada | Lista permanece funcional; filtro pode manter estado desligado por padrao ate sessao ser resolvida. |
| ER-02 | Usuario logado nao participa de nenhuma escala | Com filtro ativo, exibir estado vazio de escalas sem erro; com filtro inativo, nenhum destaque aplicado. |

## 10) Dependencias e Restricoes

- Dependencias: `useAuthSession`, dados normalizados de `members` no `ScaleFeed`.
- Restricoes: manter padrao visual atual da tela e evitar mudancas de contrato de API.

## 11) Suposicoes

- A identificacao de participacao do usuario (match de nome/username/email) existente em `isCurrentUserMember` e suficiente para este incremento.
- O destaque no cabecalho pode ser aplicado apenas via CSS sem alterar estrutura de dados da API.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-02 |
| AC-03 | T-03 |
| AC-04 | T-02, T-04 |
