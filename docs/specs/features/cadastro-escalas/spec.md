# Spec Funcional - cadastro-escalas

## 1) Contexto

- Data: 2026-04-11
- Autor(a): Codex
- Status: In Review
- Stakeholders: Produto, Frontend, UX, Lideranca, Midia/Musica

## 2) Problema

A aplicacao ainda nao possui tela de cadastro de escalas com fluxo completo de montagem da escala (componentes, funcoes, data, turno e playlist). Isso aumenta retrabalho manual e reduz controle sobre os dados da escala.

## 3) Objetivo

Implementar a tela de cadastro de escalas com identidade visual da tela de escalas, permitindo selecionar multiplos componentes, atribuir funcao para cada selecionado, definir data e turno e montar playlist por busca no YouTube ou colagem de link valido com pre-visualizacao do conteudo.

## 4) Escopo

- Criar rota de cadastro de escalas com identidade visual alinhada a tela de escalas.
- Permitir multipla selecao de componentes para a escala.
- Permitir definir a funcao individual de cada componente selecionado por meio de `select` com opcoes pre-definidas.
- Permitir escolha da data com componente de calendario reutilizavel sem biblioteca externa.
- Permitir escolha do turno da escala.
- Implementar busca de musicas no YouTube.
- Exibir pre-visualizacao do conteudo retornado da busca.
- Permitir adicionar itens selecionados na playlist da escala.
- Permitir alternativa de colar link valido de video para adicionar na playlist.
- Exibir pre-visualizacao do conteudo do link colado antes da adicao.

## 5) Nao-Escopo

- Publicacao definitiva da escala em backend de producao (pode usar mock/camada intermediaria).
- Regras complexas de conflito de agenda entre componentes.
- Edicao colaborativa em tempo real.
- Moderacao automatica de conteudo do YouTube.

## 6) Usuarios e Cenarios

- Usuario-alvo: lideres e administradores responsaveis por montagem de escalas.
- Cenarios principais:
  - Usuario seleciona multiplos componentes e define funcao de cada um.
  - Usuario escolhe data e turno da escala.
  - Usuario busca musicas no YouTube, visualiza resultado e adiciona na playlist.
  - Usuario cola um link valido de video, pre-visualiza o conteudo e adiciona na playlist.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | A tela de cadastro de escalas segue a identidade visual da tela de escalas existente. | Revisao manual comparativa. | Alta |
| AC-02 | Sistema permite selecionar multiplos componentes na mesma escala. | Teste de integracao da selecao multipla. | Alta |
| AC-03 | Para cada componente selecionado, e possivel definir/alterar funcao individualmente via `select` com opcoes pre-definidas. | Teste de integracao do formulario dinamico + validacao das opcoes do select. | Alta |
| AC-04 | Campo de data utiliza o calendario reutilizavel (sem biblioteca externa). | Teste manual + componente. | Alta |
| AC-05 | Usuario consegue selecionar turno da escala entre opcoes validas. | Teste manual + integracao. | Alta |
| AC-06 | Busca de musicas consulta YouTube e retorna lista com metadados minimos (titulo, canal, thumbnail). | Teste de integracao com mock/API route. | Alta |
| AC-07 | Resultado da busca exibe pre-visualizacao e permite adicionar musica na playlist da escala. | Teste manual + integracao. | Alta |
| AC-08 | Playlist da escala permite visualizar itens adicionados e evitar duplicacao simples. | Teste de integracao com regra de deduplicacao. | Media |
| AC-09 | Formulario bloqueia submit sem dados obrigatorios (data, turno e ao menos 1 componente). | Teste de integracao de validacao. | Alta |
| AC-10 | Usuario pode colar um link valido de video e adicionar na playlist sem usar a busca. | Teste manual + integracao de parser/validacao de URL. | Alta |
| AC-11 | O link colado apresenta pre-visualizacao (titulo/canal/thumbnail ou fallback) antes da adicao. | Teste manual + integracao de pre-visualizacao. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: busca no YouTube com debounce e feedback de carregamento para evitar travamento.
- Seguranca: chave da API do YouTube nao exposta no cliente (uso via route handler/server).
- Acessibilidade: labels, foco visivel, navegacao por teclado e feedback de erro acessivel.
- Observabilidade: log de eventos de busca, adicao/remocao de musica e submit da escala.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Usuario tenta salvar sem componentes selecionados | Bloquear submit e exibir mensagem de validacao. |
| ER-02 | Componente selecionado sem funcao definida no `select` | Destacar item pendente e bloquear submit. |
| ER-03 | Falha na busca YouTube (rede/chave/limite) | Exibir estado de erro com opcao de tentar novamente. |
| ER-04 | Usuario tenta adicionar musica duplicada na playlist | Ignorar duplicata e exibir feedback informativo. |
| ER-05 | Nenhum resultado de busca | Exibir estado vazio claro sem quebrar layout. |
| ER-06 | Usuario cola link invalido/nao suportado | Exibir mensagem de validacao e nao adicionar item. |
| ER-07 | Link valido sem metadados suficientes para preview | Exibir preview fallback minimo e permitir adicionar somente se URL for valida. |

## 10) Dependencias e Restricoes

- Dependencias: componente de calendario reutilizavel, fonte de componentes, integracao com API do YouTube (direta ou via backend route).
- Restricoes: sem biblioteca externa para calendario; credenciais de API devem ficar protegidas no servidor.

## 11) Suposicoes

- O mesmo calendario da feature `cadastro-componentes` sera reaproveitado.
- Havera route handler no projeto para encapsular chamada ao YouTube e proteger API key.
- Dataset de componentes ja estara disponivel para selecao.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-03 |
| AC-03 | T-04 |
| AC-04 | T-05 |
| AC-05 | T-06 |
| AC-06 | T-07 |
| AC-07 | T-08 |
| AC-08 | T-08 |
| AC-09 | T-09 |
| AC-10 | T-09 |
| AC-11 | T-09 |
