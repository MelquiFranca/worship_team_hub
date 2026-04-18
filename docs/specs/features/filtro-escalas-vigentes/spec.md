# Spec Funcional - filtro-escalas-vigentes

## 1) Contexto

- Data: 2026-04-18
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, Backend, Lideranca de Grupo

## 2) Problema

Atualmente, a tela de escalas exibe todas as escalas sem recorte temporal. Isso aumenta ruido visual para usuarios operacionais, porque escalas com data ja passada continuam aparecendo por padrao, mesmo quando a necessidade principal e consultar a programacao vigente.

## 3) Objetivo

Implementar filtro de periodo para escalas com comportamento padrao orientado a operacao atual:
- Exibir por padrao apenas escalas com data de hoje e futuras.
- Permitir alternar para visualizacao completa (incluindo datas passadas) quando necessario.

## 4) Escopo

- Adicionar filtro temporal na listagem de escalas com duas opcoes:
  - `current-and-future` (padrao)
  - `all`
- Ajustar `GET /api/scales` para aplicar `current-and-future` por padrao.
- Validar o query param `timeScope` no backend com retorno de erro controlado para valor invalido.
- Expor no frontend seletor de filtro para alternar entre `Hoje e futuras` e `Todas`.
- Atualizar o texto da tela para refletir o comportamento padrao.

## 5) Nao-Escopo

- Criar filtros adicionais por turno, funcao ou componente.
- Persistir preferencia de filtro por usuario entre sessoes.
- Alterar regras de permissao de visualizacao/edicao das escalas.
- Alterar ordenacao da lista alem do comportamento atual.

## 6) Usuarios e Cenarios

- Usuario-alvo: membros, lideres e ministros que consultam a pagina de escalas.
- Cenarios principais:
  - Usuario abre a tela e visualiza apenas escalas vigentes (hoje e futuras).
  - Usuario altera filtro para `Todas` e visualiza tambem escalas antigas.
  - Usuario utiliza filtro invalido via chamada direta de API e recebe erro de validacao.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | `GET /api/scales` deve retornar por padrao apenas escalas com `date >= data local atual` quando `timeScope` nao for informado. | Teste manual com chamada ao endpoint + inspecao do filtro aplicado no backend. | Alta |
| AC-02 | `GET /api/scales` deve aceitar `timeScope=all` para retornar escalas sem filtro de data. | Teste manual da API comparando resposta com e sem `timeScope=all`. | Alta |
| AC-03 | `GET /api/scales` deve rejeitar `timeScope` invalido com erro `400 BAD_REQUEST`. | Teste manual de API com valor invalido (`timeScope=foo`). | Alta |
| AC-04 | A tela de escalas deve iniciar em `Hoje e futuras` e carregar dados com esse filtro. | Validacao manual de UI + revisao de chamada em `ScalesPageClient.jsx`. | Alta |
| AC-05 | A tela deve permitir alternar para `Todas` e recarregar a lista com o novo filtro. | Validacao manual de UI + revisao do estado de filtro no client. | Alta |
| AC-06 | O cabecalho da tela deve comunicar que o comportamento padrao exibe escalas vigentes. | Validacao visual do texto no header da tela. | Media |

## 8) Requisitos Nao Funcionais

- Performance: filtro deve ser aplicado no backend para reduzir payload padrao e manter carregamento rapido.
- Seguranca: validacao de `timeScope` com erro controlado, sem executar consulta fora dos parametros permitidos.
- Acessibilidade: seletor de filtro com `label` e foco visivel por teclado.
- Observabilidade: resposta de API inclui metadado `filters` com `timeScope` e `currentLocalIsoDate` para facilitar diagnostico.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Query param `timeScope` com valor fora de `current-and-future` e `all` | Responder `400 BAD_REQUEST` com mensagem orientando valores aceitos. |
| ER-02 | Falha de carregamento de escalas apos troca de filtro | Exibir estado de erro com opcao de `Tentar novamente`, mantendo UX consistente. |
| ER-03 | Ausencia de escalas no filtro vigente | Exibir estado vazio `Nenhuma escala encontrada.` sem quebrar layout. |

## 10) Dependencias e Restricoes

- Dependencias: `GET /api/scales`, cliente `ScalesPageClient`, componente `ScaleFeed`.
- Restricoes: manter contrato atual principal da API (lista de `items`) e nao quebrar fluxo de permissoes existentes.

## 11) Suposicoes

- Campo `date` das escalas persiste em formato ISO `YYYY-MM-DD`.
- Comparacao lexicografica em ISO para filtro por data e valida no contexto atual do sistema.
- O timezone do servidor representa a referencia operacional esperada para "dia atual" na API.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-01 |
| AC-03 | T-01 |
| AC-04 | T-02 |
| AC-05 | T-02 |
| AC-06 | T-03 |
