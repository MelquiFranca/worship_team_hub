# Spec Funcional - bloco-comentarios-escalas

## 1) Contexto

- Data: 2026-04-11
- Autor(a): Codex
- Status: Proposed
- Stakeholders: Produto, Frontend, UX, Lideranca de ministerio

## 2) Problema

O card de escalas ainda nao oferece um ponto dedicado para conversas operacionais entre os componentes da escala. Alem disso, os botoes de acao usam texto, ocupando mais espaco e reduzindo a escaneabilidade em mobile.

## 3) Objetivo

Implementar um fluxo de comentarios por escala com experiencia de chat estilo WhatsApp (mensagens de texto nesta fase), adicionando um botao no canto esquerdo do rodape para abrir o bloco de mensagens e substituindo os textos dos botoes de acao dos cards por icones sem perda de clareza e acessibilidade.

## 4) Escopo

- Adicionar novo botao de `Comentarios` no grupo esquerdo do rodape do card de escala.
- Exibir um painel de chat no proprio card da escala (como uma view adicional do card).
- Implementar envio e renderizacao de mensagens de texto com layout estilo chat.
- Definir estrutura de mensagem extensivel para tipos futuros de interacao (ex.: imagem, arquivo, reacao, mensagem de sistema).
- Substituir textos dos botoes de acao do card por icones relativos, mantendo `aria-label` descritivo.
- Garantir estados visuais de hover, ativo, foco e desabilitado para os botoes iconicos.
- Garantir responsividade do chat e dos botoes iconicos em mobile e desktop.

## 5) Nao-Escopo

- Integracao em tempo real (WebSocket, polling ou push).
- Persistencia backend de mensagens nesta etapa.
- Upload de arquivos, audios ou imagens.
- Implementacao de reacoes, mencoes, leitura/entrega e moderacao.
- Mudancas na navegacao global da aplicacao.

## 6) Usuarios e Cenarios

- Usuario-alvo: lideres e componentes que acompanham uma escala especifica.
- Cenarios principais:
  - Usuario abre o card da escala e clica no icone de comentarios para consultar historico.
  - Usuario envia uma mensagem curta de alinhamento da escala.
  - Usuario alterna entre `Componentes`, `Playlist` e `Comentarios` sem perder contexto.
  - Usuario identifica a funcao de cada botao por icone + dica acessivel (`aria-label`).

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Existe um botao iconico de `Comentarios` no canto esquerdo do rodape do card, junto aos demais controles de visualizacao. | Teste visual desktop/mobile. | Alta |
| AC-02 | Ao clicar no icone de `Comentarios`, o card exibe a view de chat da escala sem quebrar o estado expandido do card. | Teste manual e integracao. | Alta |
| AC-03 | O chat permite enviar mensagem de texto e renderiza a nova mensagem imediatamente na conversa da escala atual. | Teste manual e integracao. | Alta |
| AC-04 | O modelo de dados da mensagem usa estrutura extensivel por `type` e `payload`, preparada para novos tipos alem de texto. | Revisao de codigo + teste unitario da normalizacao/render. | Alta |
| AC-05 | Todos os botoes de acao do card (visualizacoes e acoes de rodape) passam a usar icones relativos no lugar de texto visivel. | Teste visual + revisao de markup. | Alta |
| AC-06 | Botoes iconicos mantem acessibilidade (`aria-label`, foco visivel, estado pressionado quando aplicavel). | Teste de teclado e auditoria a11y manual. | Alta |
| AC-07 | O layout do chat e dos botoes nao causa sobreposicao nem scroll horizontal em viewport estreita (>= 320px). | Teste responsivo manual. | Media |
| AC-08 | A alternancia entre views (`Componentes`, `Playlist`, `Comentarios`) preserva estado local esperado e nao afeta outros cards. | Teste de regressao no feed com multiplos cards. | Media |

## 8) Requisitos Nao Funcionais

- Performance: troca de view do card em ate 100 ms percebidos em dispositivo medio.
- Seguranca: escapar/neutralizar entradas de texto para evitar injecao de HTML no chat.
- Acessibilidade: navegacao completa por teclado, foco visivel, labels descritivos e contraste adequado.
- Observabilidade: pontos de evento para `open_comments`, `send_message`, `switch_card_view` (logs locais ou camada futura de analytics).

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Escala sem historico de mensagens | Exibir estado vazio orientativo e campo de envio habilitado. |
| ER-02 | Usuario tenta enviar mensagem vazia ou apenas espacos | Bloquear envio e manter foco no input com feedback discreto. |
| ER-03 | Falha na persistencia futura (quando backend existir) | Exibir status de erro na mensagem e opcao de reenviar. |
| ER-04 | Botao iconico sem suporte visual suficiente | Manter tooltip/descricao por `aria-label` e estado de foco reforcado. |
| ER-05 | Troca rapida entre views causa perda de rascunho de mensagem | Preservar draft local por card ate envio/limpeza manual. |

## 10) Dependencias e Restricoes

- Dependencias:
  - `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
  - `src/components/organisms/ScaleFeed/ScaleFeed.module.css`
  - Fonte de dados em `src/data/scales.js`
- Restricoes:
  - Manter consistencia visual com tema atual.
  - Evitar adicionar biblioteca pesada apenas para icones (priorizar SVG inline leve).

## 11) Suposicoes

- Cada escala possui `id` estavel para mapear mensagens e estado de draft.
- O chat sera local (estado em memoria) nesta primeira entrega.
- Usuario autenticado atual pode ser representado por um `currentUserId` local ate integracao real.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-02, T-03 |
| AC-02 | T-02, T-04 |
| AC-03 | T-04, T-05 |
| AC-04 | T-01, T-04 |
| AC-05 | T-03 |
| AC-06 | T-03, T-06 |
| AC-07 | T-06 |
| AC-08 | T-02, T-04, T-06 |
