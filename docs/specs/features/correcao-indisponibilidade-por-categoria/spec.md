# Spec Funcional - correcao-indisponibilidade-por-categoria

## 1) Contexto

- Data: 2026-04-29
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Engenharia

## 2) Problema

Ao salvar indisponibilidade para apenas uma categoria em `unavailabilityByDate`, a aplicacao pode considerar o componente indisponivel para todas as categorias na exibicao e no cadastro/edicao de escala.

## 3) Objetivo

Garantir que a indisponibilidade por categoria seja respeitada exclusivamente por `unavailabilityByDate`, evitando bloqueio indevido de categorias nao selecionadas.

## 4) Escopo

- Corrigir validacao de indisponibilidade por categoria no backend de escalas.
- Corrigir exibicao/validacao no formulario de cadastro de escala para nao usar fallback legado por categoria.
- Nao gerar `unavailableDates` em novos registros de componente e em atualizacao de indisponibilidade do proprio componente.

## 5) Não-Escopo

- Migracao em massa de dados legados ja persistidos.
- Redesenho da UI de indisponibilidade.

## 6) Usuários e Cenários

- Usuário-alvo: `group-app` e `component-app`
- Cenários principais:
  - Componente marca indisponibilidade em apenas uma categoria numa data.
  - Grupo cadastra/edita escala em categoria diferente na mesma data sem bloqueio indevido.

## 7) Critérios de Aceite (testáveis)

| ID | Critério | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | `getUnavailableComponentsForDateByCategory` considera apenas `unavailabilityByDate` para bloqueio por categoria. | Teste unitario | Alta |
| AC-02 | Formulario de escala nao marca componente indisponivel em categoria diferente apenas por `unavailableDates`. | Teste manual + unitario indireto | Alta |
| AC-03 | `POST /api/components` nao persiste `unavailableDates` em novos registros. | Teste de integracao de API/revisao de payload | Alta |
| AC-04 | `PATCH /api/components/me/unavailability` nao preenche `unavailableDates` a partir de `unavailabilityByDate`. | Teste de integracao de API/revisao de payload | Alta |

## 8) Requisitos Não Funcionais

- Performance: sem impacto relevante, mudanca apenas de regra condicional.
- Segurança: sem alteracao de autorizacao.
- Acessibilidade: nao aplicavel.
- Observabilidade: manter mensagens atuais de erro/sucesso.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condição | Resposta esperada |
| --- | --- | --- |
| ER-01 | `unavailabilityByDate` invalido no PATCH de indisponibilidade | Retornar `400` com mensagem de validacao atual. |
| ER-02 | Dados legados apenas em `unavailableDates` | Nao bloquear por categoria indevida em cadastro de escala. |

## 10) Dependências e Restrições

- Dependências: APIs de componentes e escalas.
- Restrições: manter compatibilidade geral de leitura sem quebra de endpoints.

## 11) Suposições

- `unavailabilityByDate` e a fonte de verdade para indisponibilidade por categoria.
- `unavailableDates` permanece apenas como legado de leitura geral, nao de bloqueio por categoria.

## 12) Rastreabilidade inicial

| Critério | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-02 |
| AC-03 | T-03 |
| AC-04 | T-04 |
