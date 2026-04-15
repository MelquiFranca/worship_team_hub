# Spec Funcional - integracao-listagens-componentes-escalas

## 1) Contexto

- Data: 2026-04-15
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Frontend, Backend, QA, Lideranca tecnica

## 2) Problema

As telas de componentes e escalas ainda dependem de mocks locais para renderizar listagens. Isso gera divergencia entre o comportamento real do backend e a experiencia no frontend, alem de nao cobrir de forma padronizada estados criticos de loading, vazio, erro e retry quando ha falha de rede ou contrato inesperado.

## 3) Objetivo

Integrar o frontend com o backend para consumir `GET /api/components` e `GET /api/scales`, removendo o uso de mocks no caminho principal de exibicao e garantindo tratamento consistente de estado, contrato e permissao/sessao nas telas `ComponentsGallery` e `ScaleFeed`.

## 4) Escopo

- Substituir o consumo de mocks locais por chamadas reais a `GET /api/components` na exibicao da galeria de componentes.
- Substituir o consumo de mocks locais por chamadas reais a `GET /api/scales` na exibicao do feed de escalas.
- Implementar estados de `loading`, `vazio`, `erro` e `retry` nas duas listagens.
- Tratar dados desnormalizados vindos da API por meio de camada de adaptacao para contrato interno estavel.
- Garantir consistencia de contrato de dados entre a camada de integracao e os componentes `ComponentsGallery` e `ScaleFeed`.
- Respeitar regras existentes de permissao/sessao durante consumo e exibicao de dados.

## 5) Nao-Escopo

- Criar novos endpoints backend alem de `GET /api/components` e `GET /api/scales`.
- Implementar fluxo de cadastro, edicao ou exclusao de componentes/escalas.
- Redesenhar UI das telas fora dos estados necessarios para integracao.
- Alterar regras de negocio de permissao/sessao ja consolidadas no projeto.

## 6) Usuarios e Cenarios

- Usuario-alvo: lideres, ministros e membros autenticados que consultam componentes e escalas.
- Cenarios principais:
  - Usuario autenticado acessa `componentes` e visualiza lista carregada via `GET /api/components`.
  - Usuario autenticado acessa `escalas` e visualiza lista carregada via `GET /api/scales`.
  - Usuario encontra tela de loading durante requisicao e ve lista apos sucesso.
  - Usuario recebe estado vazio quando API retorna lista vazia.
  - Usuario recebe estado de erro quando a API falha e consegue tentar novamente via retry.
  - Usuario com sessao invalida ou sem permissao recebe comportamento coerente com as regras atuais.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | A tela de componentes deixa de consumir mock local no caminho principal e passa a buscar dados via `GET /api/components`. | Teste de integracao com mock de rede + revisao de importacoes/fluxo. | Alta |
| AC-02 | A tela de escalas deixa de consumir mock local no caminho principal e passa a buscar dados via `GET /api/scales`. | Teste de integracao com mock de rede + revisao de importacoes/fluxo. | Alta |
| AC-03 | Durante requisicao pendente, `ComponentsGallery` e `ScaleFeed` exibem estado de loading sem quebrar layout. | Teste de componente/integracao com atraso artificial da resposta. | Alta |
| AC-04 | Quando API retorna lista vazia, as duas telas exibem estado vazio com mensagem clara ao usuario. | Teste de integracao com resposta `[]`. | Alta |
| AC-05 | Quando API retorna erro (4xx/5xx/rede), as telas exibem estado de erro e acao de retry funcional. | Teste de integracao simulando erro e clique em retry. | Alta |
| AC-06 | Dados desnormalizados da API sao adaptados para contrato estavel exigido por `ComponentsGallery` e `ScaleFeed` sem excecao em runtime. | Teste unitario da funcao adaptadora + teste de integracao com payload irregular. | Alta |
| AC-07 | Regras existentes de permissao/sessao sao respeitadas no carregamento e exibicao das listagens. | Teste de integracao para cenario autorizado, nao autorizado e sessao expirada. | Alta |
| AC-08 | Contrato de dados compartilhado entre listagem e componentes de UI fica documentado e coberto por testes basicos. | Revisao de tipos/interfaces + teste unitario de mapeamento. | Media |

## 8) Requisitos Nao Funcionais

- Performance: cada tela deve disparar no maximo 1 requisicao inicial por recurso em primeira carga, com retry apenas por acao explicita do usuario.
- Seguranca: chamadas devem reutilizar mecanismo atual de autenticacao/sessao sem expor credenciais no cliente.
- Acessibilidade: estados de loading/erro/vazio devem ter texto legivel e sinalizacao sem depender apenas de cor.
- Observabilidade: registrar erro de integracao (status HTTP e endpoint) para suporte de diagnostico.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | `GET /api/components` retorna `500` | Exibir estado de erro em componentes com botao retry; novo clique refaz requisicao. |
| ER-02 | `GET /api/scales` retorna timeout/rede indisponivel | Exibir estado de erro em escalas com retry sem travar a pagina. |
| ER-03 | API retorna lista vazia | Exibir estado vazio especifico da tela, sem erro tecnico. |
| ER-04 | API retorna payload desnormalizado (campos ausentes/nomes divergentes) | Aplicar adaptacao/fallback e evitar quebra de renderizacao; itens invalidos devem ser descartados com seguranca. |
| ER-05 | API retorna `401` ou `403` | Aplicar fluxo de sessao/permissao existente (ex.: redirecionar, bloquear acao ou mostrar aviso conforme regra atual). |

## 10) Dependencias e Restricoes

- Dependencias: endpoints `GET /api/components` e `GET /api/scales` disponiveis e acessiveis no ambiente alvo; regras de autenticacao/sessao existentes no app.
- Restricoes: manter compatibilidade com arquitetura atual de telas (`ComponentsGallery` e `ScaleFeed`) sem alterar ownership de outras features em paralelo.

## 11) Suposicoes

- Os endpoints retornam listas consumiveis no frontend, mesmo com variacoes de formato entre ambientes.
- Ja existe mecanismo padrao para tratar permissao/sessao em chamadas autenticadas.
- A substituicao de mocks pode ser feita sem mudanca de rota ou de navegacao do usuario.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-02, T-07 |
| AC-02 | T-03, T-07 |
| AC-03 | T-05 |
| AC-04 | T-05 |
| AC-05 | T-05 |
| AC-06 | T-04 |
| AC-07 | T-06 |
| AC-08 | T-01, T-08 |
