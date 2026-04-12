# Spec Funcional - ajuste-tela-login-grupo

## 1) Contexto

- Data: 2026-04-11
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, UX, Lideranca

## 2) Problema

A tela de login ainda contem textos em ingles e usa o titulo `Instagram`, o que nao representa o contexto do produto e do grupo. Isso reduz clareza para usuarios brasileiros e enfraquece a identidade da aplicacao.

## 3) Objetivo

Ajustar a tela de login para portugues do Brasil e substituir o titulo `Instagram` por bloco de identidade do grupo com foto e nome, mantendo comportamento funcional e consistencia visual.

## 4) Escopo

- Traduzir todos os textos da tela de login para portugues do Brasil.
- Traduzir placeholders, labels, mensagens de erro/sucesso e textos de botoes.
- Substituir o titulo `Instagram` por exibicao da foto e do nome do grupo.
- Garantir fallback quando foto do grupo nao estiver disponivel.
- Manter acessibilidade e responsividade da tela.

## 5) Nao-Escopo

- Integracao real de autenticacao backend.
- Alteracoes de fluxo de cadastro ou recuperacao de senha fora da tela atual.
- Definicao de politica completa de conteudo dinamico do grupo via API.

## 6) Usuarios e Cenarios

- Usuario-alvo: membros e lideres brasileiros acessando a aplicacao.
- Cenarios principais:
  - Usuario visualiza interface totalmente em portugues do Brasil.
  - Usuario identifica o grupo pela foto e nome no topo da tela.
  - Usuario recebe mensagens de validacao em linguagem clara e local.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Todos os textos visiveis da tela de login estao em portugues do Brasil. | Revisao manual + checklist de strings. | Alta |
| AC-02 | Placeholders, labels e mensagens de erro/sucesso estao localizados em PT-BR. | Teste manual de validacao e submit. | Alta |
| AC-03 | O titulo `Instagram` deixa de ser exibido e passa a existir bloco com foto e nome do grupo. | Revisao visual da tela e componente. | Alta |
| AC-04 | Quando nao houver foto do grupo, a tela exibe fallback visual sem quebrar layout. | Teste manual de cenario sem imagem. | Media |
| AC-05 | Ajustes de texto e identidade nao quebram responsividade nem acessibilidade da tela. | Teste manual mobile/desktop + foco por teclado. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: ajuste textual e visual sem impacto perceptivel no carregamento.
- Seguranca: nao expor dados sensiveis do grupo no cliente alem de nome/foto de exibicao.
- Acessibilidade: foco visivel, labels coerentes e textos compreensiveis em PT-BR.
- Observabilidade: registrar alteracoes de UX/localizacao no changelog interno da feature.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Texto residual em ingles apos ajuste | Tratar como nao conformidade e corrigir antes de aprovar. |
| ER-02 | Foto do grupo ausente/invalida | Exibir fallback com iniciais/icone padrao do grupo. |
| ER-03 | Nome do grupo muito longo | Aplicar truncamento ou quebra controlada sem romper layout. |

## 10) Dependencias e Restricoes

- Dependencias: componente `LoginCard`, estilos da tela de login, fonte de dados de identidade do grupo (mock ou contexto).
- Restricoes: preservar comportamento atual de validacao e submit da tela.

## 11) Suposicoes

- Nome e foto do grupo estarao disponiveis por mock inicial ou configuracao local.
- A mudanca de identidade e somente visual neste ciclo.
- A localizacao PT-BR sera fixa para o escopo atual.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-01, T-03 |
| AC-03 | T-02 |
| AC-04 | T-02 |
| AC-05 | T-03 |
