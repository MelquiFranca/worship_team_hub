# Spec Funcional - migracao-indisponibilidade-menu-avatar

## 1) Contexto

- Data: 2026-04-20
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, QA

## 2) Problema

A funcionalidade de indisponibilidade estava acoplada ao fallback antigo de `/editar-perfil`, com risco de perda de acesso apos a evolucao da tela de perfil.

## 3) Objetivo

Manter a funcionalidade de indisponibilidade ativa em pagina dedicada e disponibilizar acesso no mesmo menu flutuante do avatar onde esta `Editar perfil`.

## 4) Escopo

- Criar rota dedicada `/minha-indisponibilidade`.
- Renderizar `ComponentUnavailabilityForm` nessa rota.
- Adicionar atalho no popover do avatar do `MainBottomNav`.
- Proteger a nova rota pelas mesmas regras de sessao de area de membro.

## 5) Nao-Escopo

- Alteracao da logica interna de indisponibilidade (`/api/components/me/unavailability`).
- Alteracao de UX do formulario de indisponibilidade.
- Adicao do atalho no menu admin.

## 6) Usuarios e Cenarios

- Usuario-alvo: perfil de componente.
- Cenarios principais:
  - Usuario abre menu do avatar e acessa `Minha indisponibilidade`.
  - Usuario marca/remove dias e salva normalmente na pagina dedicada.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Existe pagina dedicada `/minha-indisponibilidade` com o formulario atual de indisponibilidade. | Navegacao manual para rota. | Alta |
| AC-02 | O menu flutuante do avatar exibe `Minha indisponibilidade` no mesmo bloco de `Editar perfil` para componente. | Teste manual de UI com sessao `component-app`. | Alta |
| AC-03 | A rota nova segue politica de acesso de membro no middleware/policies. | Teste manual sem sessao e com sessao valida. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: manter render leve da nova pagina.
- Seguranca: rota protegida por politica existente de autenticacao.
- Acessibilidade: item navegavel por teclado no popover do avatar.
- Observabilidade: preservar mensagens de erro do fluxo atual da feature.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Usuario sem sessao acessa `/minha-indisponibilidade` | Redirecionamento para login conforme politica. |
| ER-02 | Perfil sem permissao tenta acessar rota | Bloqueio por politica de aud/role. |

## 10) Dependencias e Restricoes

- Dependencias: `MainBottomNav`, `ComponentUnavailabilityForm`, `policies.js`.
- Restricoes: manter item condicional para perfil de componente no menu de avatar.

## 11) Suposicoes

- `ComponentUnavailabilityForm` ja atende o requisito funcional e nao precisa refatoracao.
- Menu de avatar do `MainBottomNav` e o ponto correto para o novo atalho.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-02 |
| AC-03 | T-03 |
