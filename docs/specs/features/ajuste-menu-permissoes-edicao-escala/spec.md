# Spec Funcional - ajuste-menu-permissoes-edicao-escala

## 1) Contexto

- Data: 2026-04-18
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, Backend, QA

## 2) Problema

Usuarios com audiencia `component-app` visualizavam o menu principal com distribuicao desalinhada para a esquerda quando opcoes administrativas eram ocultadas. Alem disso, nao existia permissao granular por componente para editar playlist e imagem de uma escala, limitando a delegacao de manutencao diretamente no card da listagem.

## 3) Objetivo

Centralizar visualmente os botoes do menu para `component-app` e permitir configurar, no cadastro/edicao da escala, quais componentes podem editar playlist e imagem, com bloqueio/liberacao dessas acoes diretamente no card da tela de listagem.

## 4) Escopo

- Ajustar layout do `MainBottomNav` para distribuir colunas dinamicamente conforme itens visiveis.
- Evoluir contrato de escala no backend com `playlistEditorComponentIds` e `imageEditorComponentIds`.
- Validar no backend que permissoes apontam somente para componentes da escala.
- Expor os novos campos nos endpoints de listagem e detalhe de escalas.
- Permitir selecionar permissao extra por componente no `ScaleRegistrationForm`.
- Aplicar permissao granular no `ScaleFeed` para editar playlist e imagem por usuario participante da escala.
- Liberar `GET` de componentes e escalas para `component-app` de forma escopada por `groupId` do token.

## 5) Nao-Escopo

- Persistencia remota imediata das alteracoes locais de playlist/imagem feitas no card (nesta fase, foco em autorizacao funcional no cliente).
- Delegacao temporaria com validade/expiracao de permissao.
- Historico/auditoria detalhada de alteracoes de playlist e imagem.

## 6) Usuarios e Cenarios

- Usuario-alvo:
  - `group-app`: cria/edita escala e define permissoes granulares.
  - `component-app`: visualiza cards e pode editar playlist/imagem apenas quando autorizado na propria escala.
- Cenarios principais:
  - Lider seleciona componentes com permissao de `Editar playlist` e `Editar imagem` durante cadastro/edicao.
  - Componente autorizado remove item da playlist da escala no card.
  - Componente autorizado adiciona/remove/substitui imagem da escala no card.
  - Componente nao autorizado visualiza conteudo, mas recebe bloqueio claro ao tentar editar.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Menu principal ajusta quantidade de colunas conforme itens visiveis e nao fica deslocado para a esquerda em `component-app`. | Teste visual manual em `/escalas` com sessao `component-app`. | Alta |
| AC-02 | Cadastro/edicao de escala permite marcar componentes com permissao extra para `Editar playlist` e `Editar imagem`. | Teste manual no formulario + inspeção de payload. | Alta |
| AC-03 | API de escalas persiste e retorna `playlistEditorComponentIds` e `imageEditorComponentIds`. | Teste de integracao nos endpoints `POST/GET/PATCH` de `/api/scales`. | Alta |
| AC-04 | Backend rejeita permissoes que referenciam componentes fora da escala. | Teste de contrato com payload invalido e resposta `400`. | Alta |
| AC-05 | No feed de escalas, componente autorizado consegue editar playlist da escala; nao autorizado recebe bloqueio e mensagem clara. | Teste manual por perfil/usuario na aba playlist. | Alta |
| AC-06 | No feed de escalas, componente autorizado consegue editar imagem da escala; nao autorizado recebe bloqueio e mensagem clara. | Teste manual por perfil/usuario na aba imagens. | Alta |
| AC-07 | Endpoints de leitura de componentes/escalas aceitam `component-app` respeitando escopo do grupo no token. | Teste de integracao com token `component-app` e validacao de grupo. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: evitar re-render pesado no feed; reutilizar dados de permissao vindos da listagem quando disponiveis.
- Seguranca: `resolveRequestGroupId` deve impedir troca de `groupId` para audiencias auto-escopadas (`group-app`, `component-app`).
- Acessibilidade: controles de permissao e botoes de acao mantem labels/aria e estados `disabled` coerentes.
- Observabilidade: mensagens de feedback em UI para acoes bloqueadas e permitidas.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Payload com `playlistEditorComponentIds` ou `imageEditorComponentIds` invalido | API responde `400 BAD_REQUEST` com mensagem orientativa. |
| ER-02 | IDs de permissao fora dos componentes selecionados na escala | API responde `400 BAD_REQUEST` e nao persiste alteracao. |
| ER-03 | Componente sem permissao tenta editar playlist | UI bloqueia acao e exibe feedback de permissao insuficiente. |
| ER-04 | Componente sem permissao tenta editar imagem | UI bloqueia acao e exibe feedback de permissao insuficiente. |
| ER-05 | Listagem sem campos de permissao (legado/fallback) | Feed tenta hidratar por detalhe da escala sem quebrar renderizacao. |

## 10) Dependencias e Restricoes

- Dependencias: autenticação JWT existente, endpoints de escalas/componentes, `ScaleFeed`, `ScaleRegistrationForm`, `MainBottomNav`.
- Restricoes: manter compatibilidade com dados legados sem campos de permissao; nao quebrar fluxos de `group-app` e admin.

## 11) Suposicoes

- `componentId` em escalas e consistente com os IDs retornados no catalogo de componentes.
- Usuario `component-app` autenticado consegue ser mapeado para membro da escala por heuristica ja existente.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-02 |
| AC-03 | T-03 |
| AC-04 | T-03 |
| AC-05 | T-04 |
| AC-06 | T-04 |
| AC-07 | T-05 |
