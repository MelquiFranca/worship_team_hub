# Spec Funcional - avatar-usuario-menu-principal

## 1) Contexto

- Data: 2026-04-20
- Autor(a): Codex (Worker 2)
- Status: Implemented
- Stakeholders: Produto, Frontend, Backend, QA

## 2) Problema

O botao de perfil do menu principal podia representar dados de contexto do grupo, gerando inconsistencia com a identidade do usuario autenticado. Quando havia foto de perfil do usuario logado, ela nem sempre era priorizada no avatar do menu.

## 3) Objetivo

Exibir no botao de perfil do menu principal a foto do usuario logado quando houver foto disponivel; quando nao houver, exibir fallback textual com as iniciais do nome do usuario logado.
No menu flutuante desse botao, exibir um header com a logo do grupo e o nome do grupo para reforcar a identidade visual do contexto atual.

## 4) Escopo

- Resolver nome e foto do perfil logado a partir de sessao e perfil autenticado.
- Priorizar foto de perfil do usuario logado no avatar do menu principal.
- Aplicar fallback por iniciais com base no nome do usuario logado.
- Manter comportamento de acessibilidade do botao/avatar no menu principal.
- Preservar itens de menu ja existentes no popover do avatar (ex.: `Editar perfil`, `Minha indisponibilidade`, `Sair`).
- Adicionar header no popover do avatar com:
  - logo do grupo (com fallback textual por iniciais do grupo),
  - nome do grupo vindo das configuracoes gerais.

## 5) Nao-Escopo

- Alterar fluxo de upload/edicao de foto em `/editar-perfil`.
- Alterar regra de permissao para opcoes do menu de avatar.
- Alterar layout estrutural do menu principal alem do avatar.

## 6) Usuarios e Cenarios

- Usuario-alvo: qualquer usuario autenticado (`admin-panel`, `group-app`, `component-app`).
- Cenarios principais:
  - Usuario com foto de perfil ve foto no botao de perfil do menu principal.
  - Usuario sem foto de perfil ve iniciais geradas a partir do nome logado.
  - Usuario com indisponibilidade temporaria da API de perfil ainda ve nome/fallback via dados de sessao.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | O avatar do menu principal exibe foto do usuario logado quando `photoDataUrl/photo/photoUrl/avatarUrl` estiver disponivel. | Teste manual autenticado com usuario que possui foto no perfil. | Alta |
| AC-02 | Quando nao houver foto valida, o avatar exibe iniciais geradas com base no nome do usuario logado. | Teste manual autenticado com usuario sem foto. | Alta |
| AC-03 | O nome usado para iniciais e `aria-label` prioriza perfil carregado e usa sessao como fallback. | Inspecao manual de UI + leitura de codigo. | Alta |
| AC-04 | Em falha de `GET /api/auth/profile`, o avatar continua funcional sem quebrar navegacao. | Simular falha da API e validar renderizacao com fallback. | Media |
| AC-05 | Popover do avatar preserva acessos existentes (`Editar perfil`, `Minha indisponibilidade` quando permitido, `Sair`). | Teste manual de navegacao no menu do avatar por perfil. | Media |
| AC-06 | Popover do avatar exibe header com logo e nome do grupo. | Abrir menu do avatar e validar bloco de cabecalho com dados de `GroupSettingsContext`. | Alta |
| AC-07 | Quando nao houver logo do grupo, header exibe fallback por iniciais do nome do grupo. | Limpar foto do grupo e validar fallback no header do menu. | Media |

## 8) Requisitos Nao Funcionais

- Performance: carregamento de perfil sem bloquear render inicial da navegacao principal.
- Seguranca: leitura de perfil somente por endpoint autenticado (`/api/auth/profile`).
- Acessibilidade: `aria-label` do botao de perfil reflete o usuario resolvido; fallback textual permanece legivel.
- Confiabilidade: degradacao graciosa para dados de sessao quando API de perfil falhar.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | `GET /api/auth/profile` retorna erro (4xx/5xx/rede) | Avatar continua com dados de sessao e fallback por iniciais sem quebrar UI. |
| ER-02 | Nome de perfil vazio ou ausente | Avatar usa fallback de nome padrao e iniciais default (`EA`). |
| ER-03 | Foto retornada vazia/invalida | Avatar nao tenta render imagem e usa fallback de iniciais. |
| ER-04 | Grupo sem foto configurada | Header do menu usa fallback por iniciais do nome do grupo. |

## 10) Dependencias e Restricoes

- Dependencias: `MainBottomNav`, `AuthSessionContext`, `requestJson`, endpoint `GET /api/auth/profile`, serializacao de perfil em `src/lib/auth/profile.js`.
- Restricoes: manter compatibilidade com audiencias e permissoes existentes no menu principal.

## 11) Suposicoes

- Sessao autenticada fornece ao menos identificador e nome basico no objeto `user`.
- Endpoint `/api/auth/profile` pode enriquecer nome/foto quando houver persistencia de perfil.
- Componente `MainBottomNav` e ponto unico para o avatar do menu principal no app membro.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02, T-03 |
| AC-02 | T-01, T-03 |
| AC-03 | T-01, T-04 |
| AC-04 | T-02, T-04 |
| AC-05 | T-05 |
| AC-06 | T-07, T-08 |
| AC-07 | T-07, T-08 |
