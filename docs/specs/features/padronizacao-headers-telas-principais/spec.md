# Spec Funcional - padronizacao-headers-telas-principais

## 1) Contexto

- Data: 2026-04-21
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, UI/UX, Equipe frontend

## 2) Problema

Os headers das telas principais estavam com padrões visuais e textuais diferentes, gerando inconsistência de identidade entre fluxos relacionados.

## 3) Objetivo

Padronizar os headers de telas-chave no mesmo padrão visual da tela de cadastro de escalas, com alinhamento de tom e nomenclatura dos cards de resumo.

## 4) Escopo

- Padronizar header da tela `escalas` com base visual do padrão adotado.
- Padronizar header da tela `componentes` com base visual e cards de resumo.
- Padronizar header da tela `cadastro-componentes` com base visual e cards de resumo.
- Padronizar header da tela `configuracoes-gerais-grupo` com base visual e cards de resumo.
- Unificar nomenclatura dos cards de resumo para `Contexto`, `Status` e `Detalhe` onde aplicável.
- Ajustar a tela `escalas` para manter apenas o campo de filtro no resumo do header, conforme decisão final.

## 5) Não-Escopo

- Alterações de regras de negócio das telas.
- Criação de novos endpoints ou mudanças de API.
- Mudanças estruturais nos cards de conteúdo abaixo dos headers.

## 6) Usuários e Cenários

- Usuário-alvo: componentes e administradores do grupo.
- Cenários principais:
  - Usuário navega entre telas principais e percebe consistência visual dos headers.
  - Usuário usa o filtro da tela de escalas no header sem campos extras de contagem.

## 7) Critérios de Aceite (testáveis)

| ID | Critério | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Headers das telas `componentes`, `cadastro-componentes` e `configuracoes-gerais-grupo` seguem o padrão visual da tela `cadastro-escalas` (kicker, título, descrição e cards). | Revisão manual de UI + inspeção de JSX/CSS. | Alta |
| AC-02 | Nomenclatura dos cards de resumo foi padronizada para o mesmo tom textual (`Contexto`, `Status`, `Detalhe`) nas telas com resumo completo. | Revisão manual de textos no JSX. | Alta |
| AC-03 | Na tela `escalas`, o header mantém apenas o campo de filtro no resumo (sem `Total` e `Abertas`). | Revisão manual de UI + inspeção do JSX. | Alta |

## 8) Requisitos Não Funcionais

- Performance: sem impacto relevante esperado.
- Segurança: sem impacto.
- Acessibilidade: manter `label` associado ao `select` do filtro.
- Observabilidade: sem novos eventos.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condição | Resposta esperada |
| --- | --- | --- |
| ER-01 | `timeScopeOptions` indisponível | Header de `escalas` não renderiza bloco de filtro e não quebra layout. |
| ER-02 | Tela sem dados (ex.: componentes vazios) | Header permanece consistente; estado vazio é tratado no bloco de conteúdo existente. |

## 10) Dependências e Restrições

- Dependências: componentes React existentes e estilos CSS Modules.
- Restrições: manter padrão visual já consolidado no projeto e preservar comportamento atual das telas.

## 11) Suposições

- O padrão de referência para header é o da tela `cadastro-escalas`.
- A decisão final do produto para `escalas` é exibir somente o filtro no resumo do header.

## 12) Rastreabilidade inicial

| Critério | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02, T-03 |
| AC-02 | T-04 |
| AC-03 | T-05 |
