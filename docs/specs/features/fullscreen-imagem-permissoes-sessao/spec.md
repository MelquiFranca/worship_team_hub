# Spec Funcional - fullscreen-imagem-permissoes-sessao

## 1) Contexto

- Data: 2026-04-13
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Frontend, Backend, UX, Segurança

## 2) Problema

A visualizacao da imagem da escala ainda e limitada ao bloco atual do `ScaleFeed`, o que dificulta a leitura em telas menores e a revisao de detalhes visuais. Ao mesmo tempo, o perfil `component-app` ainda nao tem o bloqueio funcional consolidado para acionar notificacao, adicionar imagem ou excluir imagem da escala, e a sessao nao e limpa de forma consistente em logout ou expiracao de token, podendo misturar permissao e dados ao trocar de conta.

## 3) Objetivo

Permitir que a imagem da escala seja aberta em fullscreen a partir do `ScaleFeed`, com saida por botao e, no desktop, pela tecla `ESC`; remover do `component-app` qualquer permissao de acionar notificacao, adicionar imagem ou excluir imagem da escala; garantir que `group-app` possa editar qualquer escala; e garantir limpeza de dados de sessao em logout e token expirado para impedir vazamento de permissao ou mistura de contexto entre usuarios.

## 4) Escopo

- No `ScaleFeed`, clicar na imagem da escala abre a visualizacao em fullscreen.
- Exibir controle explicito para sair do fullscreen.
- No desktop, permitir fechar o fullscreen com a tecla `ESC`.
- Garantir que `component-app` nao tenha permissao funcional para excluir ou adicionar imagem da escala.
- Garantir que `component-app` nao tenha permissao funcional para disparar notificacao da escala.
- Ocultar ou desabilitar acoes de notificacao, adicao e exclusao de imagem para `component-app`, com bloqueio coerente se a acao for disparada fora da UI.
- Garantir que `group-app` tenha permissao para editar qualquer escala.
- Limpar dados de sessao ao fazer logout.
- Limpar dados de sessao ao detectar token expirado.
- Remover dados residuais de permissao, usuario e contexto de escala para evitar mistura ao entrar com outra conta.

## 5) Nao-Escopo

- Alteracao do modelo de permissao para outras acoes do `component-app` fora de notificacao e imagem da escala.
- Reestruturacao visual completa do `ScaleFeed`.
- Implementacao de galeria, zoom avancado ou edicao da imagem em fullscreen.
- Mudancas de backend para upload, processamento ou armazenamento de imagens.

## 6) Usuarios e Cenarios

- Usuario-alvo:
  - Admin
  - Lider de grupo
  - Componente (`component-app`)
- Cenarios principais:
  - Usuario clica na imagem da escala e a ve em fullscreen.
  - Usuario fecha o fullscreen pelo botao de sair.
  - Usuario no desktop fecha o fullscreen com `ESC`.
  - Usuario `component-app` visualiza a imagem, mas nao encontra acoes de notificar, adicionar imagem ou excluir imagem.
  - Usuario `group-app` consegue acionar edicao em qualquer escala da lista.
  - Usuario autenticado faz logout e nao herda dados da sessao anterior.
  - Token expirado dispara limpeza de sessao antes de redirecionar/forcar nova autenticacao.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Clicar na imagem da escala no `ScaleFeed` abre a visualizacao fullscreen da imagem. | Teste de integracao de clique + teste manual visual. | Alta |
| AC-02 | O fullscreen exibe um controle explicito para sair da visualizacao. | Teste de UI/verificacao de acessibilidade do botao. | Alta |
| AC-03 | No desktop, pressionar `ESC` fecha o fullscreen quando ele estiver aberto. | Teste e2e com foco na tela e validacao manual. | Alta |
| AC-04 | `component-app` nao consegue disparar notificacao da escala por nenhum caminho funcional da interface. | Teste de autorizacao de UI + teste de integracao de permissao. | Alta |
| AC-05 | `component-app` nao consegue adicionar imagem na escala por nenhum caminho funcional da interface. | Teste de autorizacao de UI + teste de integracao de permissao. | Alta |
| AC-06 | `component-app` nao consegue excluir imagem da escala por nenhum caminho funcional da interface. | Teste de autorizacao de UI + teste de integracao de permissao. | Alta |
| AC-07 | `group-app` consegue editar qualquer escala da lista, independentemente de estado local anterior de edicao. | Teste de integracao no `ScaleFeed` com multiplas escalas. | Alta |
| AC-08 | Ao fazer logout, a aplicacao limpa dados de sessao, permissao e contexto do usuario atual. | Teste de integracao do fluxo de logout + validacao de estado limpo. | Alta |
| AC-09 | Ao identificar token expirado, a aplicacao limpa a sessao antes de redirecionar ou exigir novo login. | Teste de integracao com token expirado + inspeção de armazenamento/estado. | Alta |
| AC-10 | Ao entrar com outra conta apos logout ou expiracao, nao ocorre mistura de permissao, usuario ou dados de escala da sessao anterior. | Teste e2e de troca de conta com usuarios diferentes. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: abertura e fechamento do fullscreen devem ocorrer sem recarregamento de pagina e sem atraso perceptivel.
- Seguranca:
  - Permissoes de notificar, adicionar imagem e excluir imagem devem ser respeitadas tambem fora da UI.
  - Dados de sessao devem ser removidos de forma completa no logout e na expiracao de token.
- Acessibilidade:
  - Botao de saida do fullscreen deve ser navegavel por teclado e possuir rotulo descritivo.
  - `ESC` deve funcionar apenas no desktop, sem interferir na navegacao principal.
- Observabilidade:
  - Registrar eventos basicos de abertura/fechamento de fullscreen e de limpeza de sessao quando aplicavel.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | A imagem da escala nao esta disponivel | Exibir estado de fallback sem quebrar o `ScaleFeed` e sem abrir fullscreen. |
| ER-02 | Usuario `component-app` tenta acionar notificacao, adicionar imagem ou excluir imagem por atalho, estado reaproveitado ou acao direta | Bloquear a acao e manter a interface coerente com permissao negada. |
| ER-03 | Usuario `group-app` encontra escala com estado local legado de bloqueio de edicao | Permitir acao de editar normalmente para `group-app`. |
| ER-04 | O usuario clica para sair do fullscreen com o estado de sessao ja invalidado | Fechar a visualizacao e concluir a limpeza de sessao sem erro visual. |
| ER-05 | Token expira enquanto o fullscreen esta aberto | Limpar sessao, fechar o fullscreen e direcionar para o fluxo de autenticacao apropriado. |
| ER-06 | Logout falha parcialmente em alguma camada de armazenamento | Garantir fallback para limpar o maximo de contexto possivel e impedir reutilizacao da sessao anterior. |

## 10) Dependencias e Restricoes

- Dependencias:
  - `Next.js` com `app router`.
  - `AuthSessionContext` existente para leitura e limpeza da sessao.
  - Regras de permissao por audience (`admin-panel`, `group-app`, `component-app`).
  - Estrutura atual do `ScaleFeed` com bloco de imagem.
- Restricoes:
  - Manter compatibilidade com o fluxo atual de autenticacao e troca de audiencia.
  - Nao introduzir quebra no comportamento das abas do `ScaleFeed`.
  - Nao alterar o contrato de dados da imagem da escala sem necessidade.

## 11) Suposicoes

- A imagem da escala ja e carregada no `ScaleFeed` em formato reutilizavel para modal ou overlay fullscreen.
- O `AuthSessionContext` centraliza ao menos parte do estado que precisa ser limpo no logout e na expiracao do token.
- A permissao de `component-app` para imagem pode ser aplicada por regras de UI e, quando existir acao sensivel, por validacao complementar.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01, AC-02, AC-03 | T-01, T-02 |
| AC-04, AC-05, AC-06 | T-03 |
| AC-07 | T-04 |
| AC-08 | T-05 |
| AC-09, AC-10 | T-04, T-05 |
