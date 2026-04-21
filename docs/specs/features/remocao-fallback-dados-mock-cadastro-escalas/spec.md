# Spec Funcional - remocao-fallback-dados-mock-cadastro-escalas

## 1) Contexto

- Data: 2026-04-21
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Frontend, Backend, QA

## 2) Problema

A tela de cadastro de escalas utiliza fallback para dados mock locais quando a API de componentes falha ou retorna vazio. Esse comportamento mascara problemas reais do backend, pode exibir informacoes nao oficiais e compromete consistencia operacional em producao.

## 3) Objetivo

Remover o fallback para base mock no cadastro de escalas e garantir que a tela opere exclusivamente com dados reais da API, exibindo estados claros de erro/vazio e bloqueando acoes que dependem de componentes quando nao houver dados validos.

## 4) Escopo

- Remover dependencia de `existingScales` como fonte de fallback no carregamento de componentes.
- Ajustar estados de UI para cenarios: carregando, vazio, erro e pronto.
- Bloquear submit/cadastro quando nao houver lista valida de componentes.
- Exibir mensagem orientativa para usuario quando backend falhar ou retornar lista vazia.
- Preservar experiencia de edicao de escala existente sem reintroduzir mock global.
- Instrumentar evento/log cliente para falha de carregamento de componentes.

## 5) Nao-Escopo

- Alteracoes de modelagem de dados do endpoint `/api/components`.
- Criacao de novos mocks para ambiente de testes manuais.
- Mudancas no layout macro da tela de cadastro.
- Reescrita completa do fluxo de playlist/campos nao relacionados.

## 6) Usuarios e Cenarios

- Usuario-alvo: lider de grupo e administradores que cadastram/editam escalas.
- Cenarios principais:
  - API de componentes responde com itens validos e formulario fica habilitado normalmente.
  - API falha e tela mostra estado de erro sem preencher componentes ficticios.
  - API responde vazio e tela mostra estado sem componentes, mantendo acoes dependentes desabilitadas.
  - Em modo edicao, componentes ja vinculados a escala seguem visiveis para consistencia do registro.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | O formulario de cadastro nao usa mais dados de `@/data/scales` como fallback para popular componentes. | Teste estatico (grep/import) + revisao de codigo. | Alta |
| AC-02 | Quando `/api/components` falha, a UI exibe estado de erro explicito e nao lista componentes mock. | Teste de integracao/frontend com API simulando erro 5xx. | Alta |
| AC-03 | Quando `/api/components` retorna vazio, a UI exibe estado de lista vazia e bloqueia selecao/submissao dependente de componentes. | Teste de integracao/frontend com payload vazio. | Alta |
| AC-04 | Quando `/api/components` retorna dados validos, a lista e exibida ordenada e o fluxo de cadastro funciona sem regressao. | Teste de integracao + fluxo manual feliz. | Alta |
| AC-05 | Em modo edicao, componentes existentes da escala continuam aparecendo no formulario mesmo que nao estejam na listagem atual da API, sem usar mock global. | Teste de integracao do modo edicao com fixture de escala existente. | Media |
| AC-06 | Mensagens de estado (carregando/erro/vazio) sao deterministicas e nao ambiguas para suporte operacional. | Teste de interface + snapshot textual dos estados. | Media |
| AC-07 | Evento de observabilidade para falha de carregamento de componentes e registrado com contexto minimo (rota, status, requestId quando disponivel), sem dados sensiveis. | Teste manual/integracao de logging cliente. | Media |
| AC-08 | Tempo de renderizacao inicial do formulario nao piora em mais de 5% no baseline local apos remocao do fallback mock. | Benchmark simples local (antes/depois). | Baixa |

## 8) Requisitos Nao Funcionais

- Performance: impacto <= 5% no tempo de renderizacao inicial da tela.
- Seguranca/Confiabilidade:
  - Nao exibir dados ficticios em ambiente produtivo.
  - Nao mascarar indisponibilidade do backend com fonte local silenciosa.
- Acessibilidade:
  - Mensagens de erro/vazio devem ser legiveis por leitor de tela e visiveis em foco de teclado.
- Observabilidade:
  - Registro de evento de falha de carregamento de componentes para diagnostico rapido.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | `/api/components` retorna 500/503 | Exibir mensagem de indisponibilidade e manter controles dependentes desabilitados. |
| ER-02 | `/api/components` retorna payload invalido | Tratar como erro de carga com mensagem padrao, sem fallback mock. |
| ER-03 | `/api/components` retorna lista vazia | Exibir estado vazio orientando cadastro previo de componentes. |
| ER-04 | Timeout de rede no carregamento inicial | Exibir erro recuperavel com opcao de tentar novamente. |
| ER-05 | Modo edicao com componente legado nao presente na listagem atual | Exibir componente do registro da escala para manter consistencia de edicao. |

## 10) Dependencias e Restricoes

- Dependencias:
  - Endpoint `GET /api/components`.
  - `ScaleRegistrationForm` e estados do formulario.
  - Fluxo de edicao de escala (`/api/scales/:id`).
- Restricoes:
  - Mudanca deve preservar comportamento de permissao e validacoes ja existentes.
  - Sem alterar contratos publicos de API no MVP.

## 11) Suposicoes

- A API de componentes e a fonte oficial e unica de dados para cadastro em producao.
- O fluxo de edicao pode complementar opcoes com dados da propria escala quando necessario.
- Existe canal de suporte para agir quando estado de erro/vazio for recorrente.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02, AC-03, AC-06 | T-02, T-03, T-05 |
| AC-04 | T-02, T-06 |
| AC-05 | T-04, T-06 |
| AC-07 | T-07 |
| AC-08 | T-08 |
