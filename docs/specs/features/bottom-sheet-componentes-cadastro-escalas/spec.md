# Spec Funcional - bottom-sheet-componentes-cadastro-escalas

## 1) Contexto

- Data: 2026-04-30
- Autor(a): Agente Codex
- Status: Draft
- Stakeholders: Produto, Design, Frontend, QA

## 2) Problema

No cadastro de escalas, a interacao com componentes nao segue o mesmo padrao visual e de acao da listagem de componentes. Isso aumenta a friccao de uso e dificulta a descoberta de acoes contextuais, principalmente em mobile.

## 3) Objetivo

Padronizar os cards de componentes no cadastro de escalas com o mesmo padrao da listagem de componentes e abrir menu contextual por clique, com comportamento responsivo por dispositivo: bottom sheet em mobile (metade da tela) e side sheet a direita em desktop, sem alterar o contrato atual da API.

## 4) Escopo

- Aplicar no cadastro de escalas o padrao visual e estrutural de cards usado na listagem de componentes.
- Habilitar abertura de menu contextual ao clicar no card de componente.
- Exibir menu em bottom sheet com altura de 50% da viewport em mobile.
- Exibir menu em side sheet ancorado a direita em desktop.
- Preservar o contrato atual de API (sem alteracoes de payload, endpoints ou semantica).

## 5) Nao-Escopo

- Alterar endpoints, payloads, validacoes de backend ou contrato de API.
- Redesenhar fluxo completo de cadastro de escalas fora da interacao dos cards.
- Introduzir novas regras de negocio de componentes.

## 6) Usuarios e Cenarios

- Usuario-alvo: pessoa operadora que realiza cadastro de escalas no sistema web.
- Cenarios principais:
  - Em mobile, tocar no card de componente no cadastro e visualizar acoes no bottom sheet de meia tela.
  - Em desktop, clicar no card de componente no cadastro e visualizar acoes no side sheet a direita.
  - Executar acoes contextuais sem quebra no fluxo atual de cadastro.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Os cards de componentes no cadastro de escalas seguem o mesmo padrao visual e estrutural da listagem de componentes. | Validacao manual com comparacao visual em ambiente local/homologacao. | Alta |
| AC-02 | Ao clicar/tocar em um card de componente no cadastro, o menu contextual e aberto corretamente. | Teste manual de interacao de clique/toque. | Alta |
| AC-03 | Em viewport mobile, o menu contextual abre em bottom sheet ocupando aproximadamente 50% da altura util da tela. | Teste manual responsivo em breakpoint mobile. | Alta |
| AC-04 | Em viewport desktop, o menu contextual abre em side sheet ancorado no lado direito. | Teste manual responsivo em breakpoint desktop. | Alta |
| AC-05 | A troca de viewport (mobile <-> desktop) mantem comportamento consistente do menu sem estados invalidos visiveis. | Teste manual redimensionando viewport durante o fluxo. | Media |
| AC-06 | O fluxo de cadastro de escalas continua funcional apos a mudanca, sem regressao nas interacoes principais da tela. | Teste manual de regressao no fluxo principal de cadastro. | Alta |
| AC-07 | Nao ha alteracao no contrato atual da API (endpoints, payloads e semantica permanecem inalterados). | Revisao tecnica + execucao de chamadas existentes e comparacao de contratos. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: abertura do menu contextual deve ocorrer sem travamento perceptivel na interacao padrao do usuario.
- Seguranca: sem novos dados sensiveis expostos; manter politicas existentes de autorizacao e autenticacao.
- Acessibilidade: foco visivel, navegacao por teclado no desktop e labels/semantica acessivel para controles interativos.
- Observabilidade: manter logs e sinais atuais; sem obrigacao de novos eventos de telemetria nesta entrega.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Falha ao carregar dados de componentes no cadastro. | Exibir estado de erro ja existente e impedir abertura de menu sem dados validos. |
| ER-02 | Componente sem acoes contextuais disponiveis. | Exibir menu com estado vazio ou opcoes desabilitadas, sem quebrar layout/interacao. |
| ER-03 | Redimensionamento abrupto entre mobile e desktop com menu aberto. | Reposicionar o container do menu para o padrao correto (bottom/side) sem tela congelada. |

## 10) Dependencias e Restricoes

- Dependencias: componentes de UI existentes para cards/sheets, time de Design para referencia visual, QA para validacao responsiva.
- Restricoes: manter contrato de API vigente; atuacao apenas no frontend do cadastro de escalas.

## 11) Suposicoes

- O padrao de card da listagem de componentes ja esta consolidado e reutilizavel.
- Os breakpoints de mobile e desktop ja estao definidos no projeto.
- Nao ha necessidade de mudanca de backend para suportar o menu contextual.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-02 |
| AC-03 | T-03 |
| AC-04 | T-04 |
| AC-05 | T-05 |
| AC-06 | T-06 |
| AC-07 | T-07 |

