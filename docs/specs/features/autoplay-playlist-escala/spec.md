# Spec Funcional - autoplay-playlist-escala

## 1) Contexto

- Data: 2026-04-20
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, QA

## 2) Problema

A playlist da escala dependia de navegacao manual entre itens, sem continuidade automatica apos o fim de cada video. Alem disso, era necessario permitir que o usuario desativasse essa automacao quando desejado.

## 3) Objetivo

Permitir execucao sequencial automatica da playlist da escala (YouTube), com controle de liga/desliga no proprio card da escala.

## 4) Escopo

- Habilitar fila automatica de reproducao no embed do YouTube com base na ordem da playlist atual.
- Exibir controle para ativar/desativar autoplay sequencial por card.
- Manter navegacao manual (`Anterior` e `Proximo`) funcionando.
- Restringir fila automatica a IDs validos de video do YouTube extraidos da URL para reduzir falhas de reproducao.
- Ajustar permissao do `iframe` para reduzir warning de `compute-pressure` no console.

## 5) Nao-Escopo

- Persistir preferencia de autoplay por usuario no backend.
- Auto-skip robusto de videos bloqueados/removidos por evento do player JS API.
- Execucao sequencial automatica para Vimeo.

## 6) Usuarios e Cenarios

- Usuario-alvo: membros que acessam `/escalas` e reproduzem a playlist.
- Cenarios principais:
  - Usuario abre uma escala com links YouTube e a playlist segue automaticamente.
  - Usuario desmarca a opcao de autoplay e a troca automatica para no video atual.
  - Usuario continua podendo trocar manualmente com botoes e dots.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Ao finalizar um video YouTube, o proximo item valido da escala e executado automaticamente quando autoplay estiver ativo. | Teste manual no card de playlist com 2+ links YouTube validos. | Alta |
| AC-02 | Usuario pode desativar autoplay no card e impedir continuidade automatica. | Teste manual no toggle `Executar playlist automaticamente em sequencia`. | Alta |
| AC-03 | Navegacao manual por `Anterior`, `Proximo` e dots permanece funcional com autoplay ligado/desligado. | Teste manual de navegacao em ambos os estados. | Alta |
| AC-04 | Fila automatica nao usa IDs invalidos/internos e reduz erro `Este video nao esta disponivel` causado por IDs incorretos. | Inspecao de codigo + teste com mistura de links validos e itens sem ID YouTube valido. | Alta |
| AC-05 | Warning de `compute-pressure` deixa de ser causado por ausencia de permissao delegada no `iframe`. | Inspecao do atributo `allow` no `iframe` de playlist. | Media |

## 8) Requisitos Nao Funcionais

- Compatibilidade: manter fluxo atual de embed para YouTube e Vimeo.
- UX: controle de autoplay visivel e compreensivel no card.
- Confiabilidade: gerar fila automatica apenas com IDs YouTube validos.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Item nao possui ID de video YouTube valido | Item nao entra na fila automatica. |
| ER-02 | Link nao suporta embed | UI exibe fallback com link externo. |
| ER-03 | Autoplay desativado pelo usuario | Player nao recebe fila sequencial automatica. |

## 10) Dependencias e Restricoes

- Dependencias: `ScaleFeed.jsx` e `ScaleFeed.module.css`.
- Restricoes: manter sem integracao com YouTube IFrame JS API nesta fase.

## 11) Suposicoes

- A maioria dos links da playlist que precisam de automacao sao do ecossistema YouTube.
- IDs de video YouTube validos seguem formato de 11 caracteres.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-02 |
| AC-03 | T-02 |
| AC-04 | T-03 |
| AC-05 | T-04 |
