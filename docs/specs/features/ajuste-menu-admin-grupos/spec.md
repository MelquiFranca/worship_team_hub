# Spec Funcional - ajuste-menu-admin-grupos

## 1) Contexto

- Data: 2026-04-19
- Autor(a): Codex
- Status: Validated
- Stakeholders: Produto, Frontend, Administracao

## 2) Problema

O menu principal da visao administrativa exibia como atalho principal o botao de `Configuracoes`, enquanto o fluxo operacional principal do admin e a navegacao para a tela de `Grupos`.

## 3) Objetivo

Ajustar o menu do painel administrativo para que o primeiro botao direcione para `Grupos` (`/admin/grupos`), em vez de `Configuracoes`.

## 4) Escopo

- Alterar rota do primeiro botao do `AdminMainNav` para `/admin/grupos`.
- Atualizar estado ativo (`aria-current`/classe ativa) para destacar `Grupos`.
- Ajustar texto acessivel (`aria-label` e `sr-only`) para refletir o novo destino.
- Atualizar iconografia do botao para representar agrupamento/listagem de grupos.

## 5) Nao-Escopo

- Remocao da rota `/admin/configuracoes`.
- Mudancas no fluxo de perfil/admin logout.
- Criacao de novos endpoints backend.

## 6) Usuarios e Cenarios

- Usuario-alvo:
  - Administrador autenticado (`admin-panel`).
- Cenarios principais:
  - Ao acessar area admin, o primeiro atalho do menu inferior abre a listagem de grupos.
  - Em qualquer rota sob `/admin/grupos`, o botao de grupos fica visualmente ativo.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Primeiro botao do `AdminMainNav` navega para `/admin/grupos`. | Revisao de codigo + clique manual em ambiente local. | Alta |
| AC-02 | Estado ativo do primeiro botao considera prefixo `/admin/grupos`. | Revisao de codigo + verificacao visual em `/admin/grupos`. | Alta |
| AC-03 | Label acessivel do primeiro botao referencia `Grupos` e nao `Configuracoes`. | Revisao de codigo (`aria-label` e `sr-only`). | Alta |
| AC-04 | Menu administrativo continua com os demais fluxos intactos (`Novo grupo`, avatar, logout). | Teste manual basico de regressao de navegacao. | Media |
| AC-05 | Icone do primeiro botao representa contexto de grupos/listagem e permanece consistente com o destino `/admin/grupos`. | Revisao visual do componente e diff do SVG no `AdminMainNav`. | Media |

## 8) Requisitos Nao Funcionais

- Acessibilidade: manter uso de `aria-label`, `aria-current` e texto oculto para leitores de tela.
- UX: preservar hierarquia visual do menu admin, alterando apenas o destino e sem quebra de layout.
- Compatibilidade: nenhuma mudanca de contrato entre frontend e backend.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Admin em rota diferente de `/admin/grupos` | Botao de grupos permanece funcional sem estado ativo. |
| ER-02 | Acesso direto a `/admin/configuracoes` | Rota continua acessivel pelos caminhos existentes (ex.: menu do avatar). |

## 10) Dependencias e Restricoes

- Dependencias: `src/components/organisms/AdminMainNav/AdminMainNav.jsx`.
- Restricoes: manter padrao visual e estrutura do menu admin existente.

## 11) Suposicoes

- A tela `/admin/grupos` segue como destino principal da rotina administrativa.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-02 |
| AC-03 | T-03 |
| AC-04 | T-04 |
| AC-05 | T-05 |
