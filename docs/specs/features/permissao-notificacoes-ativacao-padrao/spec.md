# Spec Funcional - permissao-notificacoes-ativacao-padrao

## 1) Contexto

- Data: 2026-04-24
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, Componentes (usuarios finais)

## 2) Problema

O aplicativo depende de notificacoes push para avisar componentes sobre atualizacoes de escala, mas o pedido de permissao do navegador ocorre apenas de forma automatica e sem um fluxo de solicitacao explicita ao usuario. Em alguns navegadores, isso reduz a chance de concessao e pode impedir ativacao do push por padrao quando tecnicamente possivel.

## 3) Objetivo

Garantir que o aplicativo solicite permissao de notificacoes ao usuario de forma clara e que, quando a permissao estiver concedida, a ativacao da subscription push ocorra automaticamente sem etapas manuais extras.

## 4) Escopo

- Exibir solicitacao de ativacao de notificacoes para usuario `component-app` quando a permissao estiver pendente (`default`).
- Permitir que o usuario conceda permissao por meio de acao explicita na interface.
- Ativar subscription push automaticamente quando a permissao estiver `granted`.
- Repetir tentativas tecnicas de ativacao em falhas transitorias sem quebrar autenticacao/sessao.

## 5) Nao-Escopo

- Alterar regras de envio de notificacao para `admin-panel` e `group-app`.
- Criar centro de notificacoes in-app (historico, leitura, configuracoes avancadas).
- Alterar backend de dispatch das notificacoes de escala.

## 6) Usuarios e Cenarios

- Usuario-alvo: componentes autenticados (`component-app`).
- Cenarios principais:
  - Usuario entra no app com permissao `default`, visualiza CTA para ativar notificacoes e aceita permissao.
  - Usuario ja possui permissao `granted`; app ativa push automaticamente sem clicar em botao.
  - Usuario nega permissao; app nao quebra fluxo principal e evita tentativas invasivas.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Usuario `component-app` com permissao `default` visualiza solicitacao clara para ativar notificacoes no app. | Teste manual na UI apos login de componente com permissao inicial pendente. | Alta |
| AC-02 | Ao acionar a solicitacao, o app chama o pedido de permissao do navegador e, em caso de `granted`, registra subscription push automaticamente. | Teste manual em navegador suportado + verificacao de chamada em `/api/push/subscribe`. | Alta |
| AC-03 | Quando a permissao ja estiver `granted`, o app tenta ativar push automaticamente no carregamento da sessao sem exigir clique do usuario. | Teste manual com permissao preconcedida e monitoramento de fluxo de registro. | Alta |
| AC-04 | Se houver falha tecnica transitoria (ex.: erro de chave publica, falha em subscribe), o app permanece funcional e tenta novamente de forma controlada. | Teste manual simulando falha temporaria e verificando nova tentativa automatica. | Media |
| AC-05 | Se a permissao for negada (`denied`) ou push nao for suportado, o app nao gera erro fatal nem bloqueia uso normal da aplicacao. | Teste manual com permissao negada e em ambiente sem suporte. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: tentativa automatica de ativacao deve iniciar em ate 3s apos sessao autenticada elegivel.
- Seguranca: manter registro de subscription restrito ao usuario autenticado via endpoint existente.
- Confiabilidade: falhas de push nao podem invalidar login nem causar logout.
- Acessibilidade: CTA de permissao deve ser acionavel por teclado e com texto claro.
- Observabilidade: manter motivo de falha/estado da ativacao disponivel no estado de sessao para depuracao.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Navegador sem suporte a Push API/Notification API | App nao exibe erro fatal; status de push fica indisponivel/nao suportado. |
| ER-02 | Usuario nega permissao de notificacao | App encerra tentativa automatica de ativacao e segue funcionando normalmente. |
| ER-03 | Falha ao obter chave publica VAPID | App mantem sessao ativa e agenda nova tentativa tecnica de ativacao. |
| ER-04 | Falha ao registrar subscription no endpoint `/api/push/subscribe` | App mantem sessao ativa, registra falha e permite nova tentativa. |

## 10) Dependencias e Restricoes

- Dependencias:
  - `AuthSessionContext` para detectar audiencia autenticada.
  - `registerClientPushSubscription` para solicitar permissao e registrar subscription.
  - Service Worker `/push-sw.js` e endpoint `/api/push/subscribe`.
- Restricoes:
  - Navegadores podem exigir gesto de usuario para exibir prompt de permissao.
  - Fluxo de push segue limitado a audiencia `component-app` no endpoint atual.

## 11) Suposicoes

- O produto aceita CTA de ativacao de notificacoes visivel para `component-app` enquanto permissao estiver pendente.
- Nao ha necessidade de tela dedicada de preferencias; um prompt contextual no app e suficiente.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-02, T-03 |
| AC-02 | T-01, T-02, T-03 |
| AC-03 | T-01, T-02 |
| AC-04 | T-01, T-02, T-04 |
| AC-05 | T-01, T-02, T-04 |
