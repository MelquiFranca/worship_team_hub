# Spec Funcional - menu-navegacao-principal

## 1) Contexto

- Data: 2026-04-11
- Autor(a): Codex
- Status: Proposed
- Stakeholders: Produto, Frontend, UX, Lideranca

## 2) Problema

A aplicacao nao possui um menu principal fixo e padronizado para navegacao global no rodape. Isso dificulta o acesso rapido as telas mais usadas, reduz a descoberta das acoes principais e deixa os pontos de acesso ao cadastro e ao perfil sem um fluxo consistente.

## 3) Objetivo

Implementar um menu de navegacao principal fixo na parte inferior da tela, com ordem definida da esquerda para a direita, inspirado no Instagram, com os botões principais representados apenas por icones ou imagem de avatar, sem textos visiveis, incluindo acesso a Escalas, Componentes, acoes de criacao via botao "+", Configuracoes gerais do grupo e menu do avatar do usuario logado.

## 4) Escopo

- Criar menu inferior fixo com 5 itens na ordem:
  - Escalas
  - Componentes
  - Botao "+"
  - Configuracoes gerais do grupo
  - Avatar do perfil logado
- Renderizar os botões principais apenas com icones ou imagem de avatar, sem textos visiveis.
- Garantir que Escalas e Componentes levem para as rotas principais correspondentes.
- Garantir que o botao "+" abra menu flutuante com:
  - Cadastro de escalas
  - Cadastro de componentes
- Garantir que o avatar do usuario logado abra menu flutuante com:
  - Editar Perfil
  - Sair
- Aplicar o tema visual ativo do app ao menu, respeitando cores, contrastes e tokens da interface atual.
- Manter visual coerente com um padrao inspirado no Instagram e com as specs ja existentes no projeto.
- Garantir que o bloco do menu nao tenha bordas visiveis.
- Garantir que o menu fique colado a borda inferior da viewport, sem espaco abaixo.
- Garantir comportamento responsivo para desktop e mobile, com menu sempre acessivel.
- Garantir estados visuais de item ativo, foco e hover.

## 5) Nao-Escopo

- Reestruturar rotas de negocio fora dos acessos listados.
- Implementar backend novo para cadastro, configuracoes ou perfil.
- Alterar regras de autenticacao ou permissao.
- Criar novas telas alem dos fluxos de destino ja previstos.
- Implementar design system novo ou migracao visual do app inteiro.

## 6) Usuarios e Cenarios

- Usuario-alvo: lideres e administradores logados.
- Cenarios principais:
  - Usuario acessa Escalas ou Componentes pelo menu inferior.
  - Usuario abre o botao "+" para ir ao cadastro de escalas ou componentes.
  - Usuario abre o avatar para editar o perfil ou sair da sessao.
  - Usuario navega em mobile sem perder acesso ao menu principal.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | O menu principal aparece fixo na parte inferior da tela, colado a borda inferior, sem bordas visiveis, com a ordem correta dos 5 itens: Escalas, Componentes, "+", Configuracoes gerais do grupo e Avatar, todos exibidos apenas por icones ou imagem de avatar, sem textos visiveis. | Revisao visual manual em desktop e mobile. | Alta |
| AC-02 | Os itens Escalas e Componentes levam para suas rotas principais quando acionados. | Teste manual de navegacao e teste de integracao da acao. | Alta |
| AC-03 | O botao "+" abre um menu flutuante com as opcoes Cadastro de escalas e Cadastro de componentes, sem fechamento por Escape. | Teste manual de interacao e teste de integracao do menu. | Alta |
| AC-04 | As opcoes do menu "+" levam para os fluxos de cadastro corretos. | Teste de integracao com mock de navegacao. | Alta |
| AC-05 | O avatar do usuario logado abre menu flutuante com as opcoes Editar Perfil e Sair, sem fechamento por Escape. | Teste manual e teste de interacao do componente. | Alta |
| AC-06 | A acao Editar Perfil leva para o fluxo de edicao do perfil. | Teste de integracao com mock/rota. | Media |
| AC-07 | A acao Sair dispara o fluxo de logout e encerra a sessao ativa. | Teste de integracao com mock de autenticacao. | Alta |
| AC-08 | O menu permanece acessivel e funcional em telas pequenas, com o tema ativo aplicado ao bloco do menu e sem sobrepor o conteudo principal de forma critica. | Teste manual responsivo em mobile e tablet. | Alta |
| AC-09 | O menu e os menus flutuantes sao navegaveis por teclado, com foco visivel, e o fechamento manual dos menus flutuantes ocorre somente por clique fora. | Teste manual de acessibilidade. | Media |

## 8) Requisitos Nao Funcionais

- Performance: abertura dos menus flutuantes deve ser imediata, sem travar a interacao principal.
- Seguranca: acoes de logout e perfil devem respeitar o estado real da sessao e nao expor dados sensiveis no cliente.
- Acessibilidade: foco visivel, rotulos descritivos, aria adequada e operacao por teclado.
- UI: o menu deve usar visual inspirado no Instagram, sem bordas no bloco principal e com botões principais sem textos visiveis.
- Layout: o menu deve ficar colado a borda inferior da viewport, sem espaco inferior externo.
- Observabilidade: registrar interacoes principais do menu, como abertura do "+" e logout, quando houver mecanismo de log disponivel.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Usuario sem avatar carregado ou sem foto de perfil | Exibir fallback visual com iniciais ou icone padrao. |
| ER-02 | Link de destino indisponivel ou rota ainda nao criada | Manter menu responsivo e exibir fallback sem quebrar a navegacao. |
| ER-03 | Falha no logout | Exibir feedback de erro e manter a sessao ate nova tentativa bem-sucedida. |
| ER-04 | Menu flutuante aberto e usuario toca fora dele | Fechar o menu sem alterar a pagina atual. |
| ER-05 | Usuario pressiona Escape com menu aberto | O menu permanece aberto; o fechamento manual continua disponivel apenas por clique fora. |

## 10) Dependencias e Restricoes

- Dependencias: contexto de autenticacao do usuario, rotas de Escalas, Componentes, Cadastro de escalas, Cadastro de componentes, Configuracoes gerais do grupo e Editar Perfil.
- Restricoes: manter o menu fixo no rodape, colado a borda inferior, sem bordas visiveis e sem fechamento por Escape nos menus flutuantes.

## 11) Suposicoes

- O usuario estara autenticado ao acessar o menu principal.
- As rotas de destino ja existem ou serao disponibilizadas em paralelo.
- O avatar e o nome do usuario poderao ser obtidos do contexto de sessao.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-02 |
| AC-03 | T-03 |
| AC-04 | T-03 |
| AC-05 | T-04 |
| AC-06 | T-04 |
| AC-07 | T-04 |
| AC-08 | T-05 |
| AC-09 | T-05 |
