# Spec Funcional - tela-escalas

## 1) Contexto

- Data: 2026-04-11
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, UX, Ministerio/Lideranca

## 2) Problema

A aplicacao ainda nao possui uma tela dedicada para visualizacao de escalas em formato de feed. Isso dificulta consulta rapida por data/turno, leitura dos componentes escalados e acesso as playlists relacionadas a cada escala.

## 3) Objetivo

Implementar uma tela de escalas com experiencia visual inspirada no feed do Instagram, com cabecalho por card (data e turno), acoes no rodape e alternancia entre visualizacao de componentes e carousel de musicas.

## 4) Escopo

- Criar listagem de escalas em formato de feed com cards.
- Exibir no cabecalho de cada card: data da escala e turno.
- Exibir rodape com acoes:
  - Lado esquerdo: botao "Componentes escalados" e botao "Playlist".
  - Lado direito: botao "Editar escala".
- Definir visualizacao principal por estado de aba no rodape esquerdo:
  - Default: componentes escalados.
  - Alternativa: carousel de musicas da playlist.
- Na visualizacao de componentes:
  - Exibir foto, nome e funcao.
  - Exibir lider sempre em primeiro.
  - Agrupar demais componentes por funcao.
- Na visualizacao de playlist:
  - Exibir carousel com itens de video.
  - Permitir reproduzir cada link de video disponivel.

## 5) Nao-Escopo

- Regras completas de permissao/autorizacao de edicao.
- Persistencia backend da edicao de escala.
- Upload de novas musicas/video.
- Moderacao de links externos.

## 6) Usuarios e Cenarios

- Usuario-alvo: lideres, ministros e membros que consultam escalas.
- Cenarios principais:
  - Usuario navega pelo feed e identifica data/turno de cada escala.
  - Usuario alterna entre componentes e playlist sem sair do card.
  - Usuario toca videos da playlist direto no carousel.
  - Usuario aciona edicao da escala pelo botao do rodape direito.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Cada card de escala exibe cabecalho com data e turno visiveis. | Teste manual visual + teste de renderizacao do card. | Alta |
| AC-02 | Rodape apresenta os 3 botoes de acao no agrupamento correto (2 a esquerda, 1 a direita). | Teste manual visual responsivo (desktop/mobile). | Alta |
| AC-03 | Conteudo principal inicia por padrao na aba de componentes escalados. | Teste de integracao da interacao inicial do card. | Alta |
| AC-04 | Ao alternar para playlist, o card troca o conteudo principal sem recarregar a pagina. | Teste de integracao (clique e troca de estado). | Alta |
| AC-05 | Lista de componentes exibe lider sempre no topo e os demais agrupados por funcao. | Teste unitario da ordenacao/agrupamento + teste manual. | Alta |
| AC-06 | Cada item de componente exibe foto, nome e funcao. | Teste manual e snapshot do bloco de componente. | Media |
| AC-07 | Carousel da playlist exibe os videos disponiveis e permite reproducao de cada link. | Teste manual de reproducao + teste de integracao do carousel. | Alta |
| AC-08 | Botao "Editar escala" dispara acao de edicao esperada (rota/modal/callback). | Teste de integracao com mock de navegacao/acao. | Media |

## 8) Requisitos Nao Funcionais

- Performance: troca de abas no card deve ser imediata e fluida.
- Seguranca: links de video externos devem ser tratados com parametros seguros quando aplicavel.
- Acessibilidade: botoes com foco visivel, labels descritivos e navegacao por teclado.
- Observabilidade: registrar evento de troca de aba e clique em editar (quando houver tracking).

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Escala sem componentes | Exibir estado vazio orientando ausencia de componentes. |
| ER-02 | Escala sem playlist | Exibir estado vazio na aba playlist com mensagem clara. |
| ER-03 | Link de video invalido/indisponivel | Exibir feedback de indisponibilidade e manter navegacao do carousel. |
| ER-04 | Usuario sem permissao de edicao | Botao editar desabilitado ou oculto conforme regra vigente. |

## 10) Dependencias e Restricoes

- Dependencias: estrutura Next.js atual, componentes de UI e dados de escala/playlist.
- Restricoes: manter coerencia visual com feed estilo Instagram sem copiar ativos proprietarios.

## 11) Suposicoes

- Dados de escala incluem data, turno, lider e lista de componentes com funcao e foto.
- Dados de playlist incluem links validos para reproducao.
- Acao de edicao pode inicialmente usar callback/mock de navegacao.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-01, T-04 |
| AC-03 | T-02 |
| AC-04 | T-02, T-04 |
| AC-05 | T-03 |
| AC-06 | T-03 |
| AC-07 | T-04 |
| AC-08 | T-05 |
