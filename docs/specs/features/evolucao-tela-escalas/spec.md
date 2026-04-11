# Spec Funcional - evolucao-tela-escalas

## 1) Contexto

- Data: 2026-04-11
- Autor(a): Codex
- Status: Proposed
- Stakeholders: Produto, Frontend, UX, Lideranca

## 2) Problema

A tela atual de escalas mostra todos os cards sempre abertos e nao oferece uma acao direta de notificacao por escala. Isso reduz a capacidade de escanear a lista rapidamente, dificulta a leitura em telas menores e aumenta o custo de interacao para localizar um card especifico.

## 3) Objetivo

Melhorar a tela de escalas com um card expansivel/compactavel por item e com a acao `Notificar` posicionada ao lado esquerdo de `Editar escala`, permitindo leitura rapida da lista, foco por escala e acesso mais claro as acoes principais.

## 4) Escopo

- Adicionar o botao `Notificar` no rodape do card, imediatamente a esquerda de `Editar escala`.
- Permitir expandir e compactar cada card de escala de forma independente.
- Na visao compacta, exibir apenas o cabecalho com data e turno.
- Na visao expandida, exibir o conteudo completo atual do card e as acoes disponiveis.
- Manter o estado de expansao por card durante interacoes locais da tela.
- Garantir comportamento acessivel por teclado e leitura por tecnologias assistivas.
- Garantir comportamento responsivo em desktop e mobile.

## 5) Nao-Escopo

- Envio real de notificacoes pelo backend.
- Regras de permissao/autorizacao para notificar ou editar.
- Persistencia do estado expandido apos recarregar a pagina.
- Mudancas no modelo de dados de escala.
- Redesign completo da tela ou do sistema visual.

## 6) Usuarios e Cenarios

- Usuario-alvo: lideres, ministros e membros que consultam escalas.
- Cenarios principais:
  - Usuario visualiza a lista de escalas em modo compacto para localizar rapidamente uma data e um turno.
  - Usuario expande um card especifico para ver detalhes e acionar `Notificar` ou `Editar escala`.
  - Usuario colapsa o card apos concluir a leitura para manter a lista enxuta.
  - Usuario navega pela tela em teclado, mouse e toque sem perder contexto.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Cada card de escala possui controle explicito de expandir/compactar com estado independente por card. | Teste manual e teste de integracao com multiplos cards. | Alta |
| AC-02 | Na visao compacta, o card exibe apenas o cabecalho com data e turno, sem o restante do conteudo visivel. | Teste visual em desktop e mobile. | Alta |
| AC-03 | Na visao expandida, o card exibe o conteudo completo e o rodape com `Notificar` a esquerda de `Editar escala`. | Teste visual e de renderizacao do card. | Alta |
| AC-04 | A acao `Notificar` dispara o comportamento esperado da tela sem quebrar o estado do card nem bloquear outras interacoes. | Teste de integracao com mock da acao. | Alta |
| AC-05 | O controle de expandir/compactar e os botoes de acao sao navegaveis por teclado, possuem foco visivel e texto acessivel. | Teste manual de acessibilidade e inspecao de atributos ARIA. | Alta |
| AC-06 | A tela continua legivel e utilizavel em larguras de desktop e mobile, sem sobreposicao de elementos ou scroll horizontal indevido. | Teste visual responsivo. | Alta |
| AC-07 | A expansao/compactacao de um card nao altera o estado dos demais cards da lista. | Teste de integracao com multiplos cards. | Media |
| AC-08 | Ao re-renderizar a lista por interacoes locais da pagina, o estado visual dos cards ativos nao sofre reset inesperado. | Teste de integracao e regressao de estado. | Media |

## 8) Requisitos Nao Funcionais

- Performance: alternar entre visao compacta e expandida deve ser imediato e sem perceptivel travamento.
- Seguranca: a acao de notificacao nao deve expor dados adicionais fora do contexto da escala.
- Acessibilidade: controles com `aria-expanded`, rotulos claros, ordem de tab consistente e foco visivel.
- Observabilidade: registrar eventos de expansao, compactacao e clique em `Notificar` quando houver camada de tracking.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Card sem dados suficientes para montar o cabecalho | Exibir fallback seguro para data/turno e manter o controle de expansao desabilitado ou indisponivel. |
| ER-02 | A acao `Notificar` nao estiver disponivel por regra de negocio ou falha de integracao | Exibir feedback claro e manter o card em seu estado atual. |
| ER-03 | Usuario aciona expandir/compactar repetidas vezes em curto intervalo | Manter o estado final consistente sem duplicar transicoes visuais. |
| ER-04 | Re-render da lista apos uma interacao altera a posicao dos cards | Preservar o estado de expansao por identificador estavel do card. |
| ER-05 | Tela em viewport estreita nao comporta todos os controles em uma linha | Reorganizar os controles sem quebra de leitura nem sobreposicao. |

## 10) Dependencias e Restricoes

- Dependencias: estrutura atual da tela de escalas, componentes de card, sistema de estilos e camada de dados da lista.
- Restricoes: manter compatibilidade com a experiencia atual da tela e evitar regressao de comportamento nos cards ja existentes.

## 11) Suposicoes

- Cada card possui um identificador estavel para controlar expansao/compactacao.
- A acao `Editar escala` continua existindo e o novo botao `Notificar` nao substitui outras acoes.
- O estado de expansao pode ser mantido em memoria de UI, sem persistencia entre recargas.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-01, T-03 |
| AC-03 | T-02, T-03 |
| AC-04 | T-02, T-04 |
| AC-05 | T-04 |
| AC-06 | T-03, T-04 |
| AC-07 | T-01, T-04 |
| AC-08 | T-01, T-02, T-04 |
