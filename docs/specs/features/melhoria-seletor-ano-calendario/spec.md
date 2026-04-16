# Spec Funcional - melhoria-seletor-ano-calendario

## 1) Contexto

- Data: 2026-04-15
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Frontend, UX, QA

## 2) Problema

O componente `Calendar` permite navegar mes a mes, mas a troca de ano em intervalos longos exige muitos cliques e reduz a eficiencia em fluxos de cadastro com datas antigas (ex.: nascimento). Isso aumenta tempo de preenchimento e risco de erro de selecao.

## 3) Objetivo

Evoluir o `Calendar` para incluir seletor de ano por select rolavel, mantendo selecao de data e navegacao de mes sem regressao, com reuso nas telas de cadastro de componentes e cadastro de escalas, incluindo suporte de acessibilidade e boa experiencia em mobile.

## 4) Escopo

- Adicionar no `Calendar` um select de ano rolavel para navegacao rapida em longos intervalos.
- Preservar controles existentes de mes e comportamento atual de selecao de dia.
- Reutilizar a nova versao do `Calendar` em `ComponentRegistrationForm` e `ScaleRegistrationForm`.
- Garantir navegacao por teclado, rotulos para leitor de tela e foco visivel no seletor de ano.
- Ajustar layout para responsividade mobile sem quebra de usabilidade.

## 5) Nao-Escopo

- Inclusao de biblioteca externa de date picker.
- Alteracao de regras de negocio de validacao de data fora do comportamento ja existente.
- Mudanca de layout completo dos formularios de cadastro.
- Persistencia backend ou alteracao de payload de submit.

## 6) Usuarios e Cenarios

- Usuario-alvo: lideres e administradores que cadastram componentes e escalas.
- Cenarios principais:
  - Usuario seleciona ano antigo rapidamente via select rolavel para informar data de nascimento.
  - Usuario alterna mes apos escolher ano e confirma dia sem perder contexto.
  - Usuario em mobile abre o calendario e seleciona ano/mes/dia sem sobreposicao ou corte de elementos.
  - Usuario com teclado e leitor de tela interage com o seletor de ano e recebe feedback correto de foco e rotulos.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | `Calendar` exibe seletor de ano em formato select rolavel com intervalo suficiente para datas antigas e futuras de uso do sistema. | Teste de componente + validacao manual da lista de anos. | Alta |
| AC-02 | Alterar o ano no select atualiza corretamente o mes exibido sem quebrar selecao de dia. | Teste de integracao do calendario + regressao manual. | Alta |
| AC-03 | Navegacao de mes anterior/proximo continua funcional apos introducao do seletor de ano. | Teste de regressao manual + componente. | Alta |
| AC-04 | O componente evoluido e reutilizado em cadastro de componentes e cadastro de escalas, sem duplicacao de logica. | Revisao de arquitetura + teste de integracao em 2 formularios. | Alta |
| AC-05 | Seletor de ano atende acessibilidade minima: foco por teclado, `label`/`aria-label` compreensivel e leitura correta por leitor de tela. | Teste manual com teclado + auditoria de acessibilidade. | Alta |
| AC-06 | Em viewport mobile, seletor de ano e controles do calendario permanecem usaveis sem overflow horizontal. | Teste manual responsivo (320px a 768px). | Media |

## 8) Requisitos Nao Funcionais

- Performance: troca de ano deve refletir no calendario em ate 100 ms em ambiente local de desenvolvimento sem travamento perceptivel.
- Seguranca: nenhuma alteracao de seguranca aplicacional; nao registrar dados sensiveis de formulario em logs de depuracao.
- Acessibilidade: navegacao completa por teclado, foco visivel, nome acessivel do select de ano e sem bloqueio de leitura por leitor de tela.
- Observabilidade: manter pontos de log existentes; se houver log de depuracao temporario durante desenvolvimento, remover antes de concluir a feature.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Ano selecionado fora do intervalo configurado | Componente ignora valor invalido e mantem ultimo estado valido. |
| ER-02 | Mudanca de ano para mes/dia que nao existe (ex.: 29/02 em ano nao bissexto) | Ajustar para data valida mais proxima conforme regra atual do componente ou solicitar nova selecao sem quebrar estado. |
| ER-03 | Interacao somente por teclado no select | Foco deve percorrer elementos em ordem logica, com indicacao visual clara. |
| ER-04 | Tela mobile com largura reduzida | Calendario permanece legivel, sem corte de controles e sem sobreposicao de select com botoes de mes. |

## 10) Dependencias e Restricoes

- Dependencias: `src/components/molecules/Calendar/Calendar.jsx`, `ComponentRegistrationForm`, `ScaleRegistrationForm`, suite de testes frontend existente.
- Restricoes: manter arquitetura atual sem biblioteca externa de calendario; evitar mudancas fora do componente e dos 2 formularios consumidores.

## 11) Suposicoes

- O `Calendar` atual ja controla estado de mes/ano internamente e permite extensao para select de ano.
- As telas de cadastro de componentes e escalas ja compartilham o mesmo componente de calendario.
- O intervalo padrao de anos pode ser fixado inicialmente (ex.: ano atual - 100 ate ano atual + 10) e refinado em ciclo futuro se necessario.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-03 |
| AC-03 | T-03, T-07 |
| AC-04 | T-04 |
| AC-05 | T-05 |
| AC-06 | T-06 |
