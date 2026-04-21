# Spec Funcional - sincronizacao-sessao-login-logout

## 1) Contexto

- Data: 2026-04-21
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, QA

## 2) Problema

Apos autenticar, a interface nao aplicava imediatamente dados da sessao (tema e permissoes de menu), exigindo refresh manual para refletir estado real do usuario. No logout, parte dos dados podia permanecer em memoria ate nova navegacao.

## 3) Objetivo

Garantir sincronizacao imediata da sessao no pos-login e limpeza completa dos dados de sessao no logout, sem necessidade de refresh manual da pagina.

## 4) Escopo

- Atualizar o contexto de autenticacao para permitir refresh explicito da sessao apos login.
- Disparar refresh de sessao no fluxo de login antes do redirecionamento.
- Recarregar configuracoes remotas do grupo somente quando houver sessao autenticada.
- Resetar estados em memoria dependentes da sessao ao sair da aplicacao.

## 5) Nao-Escopo

- Alterar regras de permissao de negocio no backend.
- Redesenhar componentes de navegacao.
- Introduzir nova persistencia de dados de sessao.

## 6) Usuarios e Cenarios

- Usuario-alvo: gestores de grupo, componentes e administradores.
- Cenarios principais:
  - Usuario faz login e ve imediatamente tema e opcoes de menu corretas.
  - Usuario faz logout e nao encontra dados de sessao anteriores na UI.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Apos login bem-sucedido, contexto de autenticacao e permissoes sao atualizados antes do redirect. | Revisao tecnica do fluxo `LoginCard -> refreshSession -> router.replace` + teste manual. | Alta |
| AC-02 | Tema e configuracoes do grupo passam a recarregar quando sessao autenticada ficar disponivel, sem refresh manual da pagina. | Revisao tecnica do `GroupSettingsContext` + teste manual de login. | Alta |
| AC-03 | No logout, dados de sessao persistidos e estados em memoria ligados a perfil/sessao sao limpos. | Revisao tecnica de `clearClientSessionData`, reset de contexto e teste manual de logout. | Alta |
| AC-04 | Mudanca nao introduz erros de lint no projeto. | Execucao de `npm run lint`. | Media |

## 8) Requisitos Nao Funcionais

- Performance: nao adicionar recarregamento completo da aplicacao.
- Seguranca: manter limpeza de dados locais de sessao ao sair.
- Acessibilidade: sem alteracao de fluxo de foco e navegacao.
- Observabilidade: rastreabilidade por arquivos alterados e evidencias em spec docs.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Falha no endpoint `/api/auth/me` durante refresh pos-login | Sessao nao e promovida; fluxo permanece seguro sem permissao indevida. |
| ER-02 | Falha no endpoint `/api/group-settings` apos login | Contexto usa fallback local sem quebrar UI. |
| ER-03 | Falha no endpoint `/api/auth/logout` | Limpeza local da sessao ainda acontece no cliente. |

## 10) Dependencias e Restricoes

- Dependencias: `AuthSessionContext`, `GroupSettingsContext`, `LoginCard`, `MainBottomNav`.
- Restricoes: manter compatibilidade com fluxo atual de rotas (`/login`, `/escalas`, `/admin/*`).

## 11) Suposicoes

- O endpoint `/api/auth/me` retorna sessao valida imediatamente apos login.
- `clearClientSessionData` contem todas as chaves de storage usadas para sessao do cliente.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-03 |
| AC-03 | T-04, T-05 |
| AC-04 | T-06 |
