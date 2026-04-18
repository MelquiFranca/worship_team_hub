# Spec Funcional - notificacao-push-escalas

## 1) Contexto

- Data: 2026-04-18
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Frontend, Backend, Midia/Musica

## 2) Problema

A criacao de escala nao dispara notificacao push real para os componentes selecionados, e o botao `Notificacao` na tela de escalas apenas simula feedback local sem chamada ao backend. Isso reduz a confiabilidade da comunicacao e aumenta risco de ausencia por falta de aviso.

## 3) Objetivo

Implementar envio de notificacao push automatico e imediato ao criar escala, e permitir reenvio manual da mesma notificacao pelo botao `Notificacao`, com controle de permissao por audiencia.

## 4) Escopo

- Disparar notificacao push automaticamente apos criacao bem-sucedida de escala.
- Notificar somente os componentes selecionados para participar da escala.
- Criar endpoint dedicado para reenvio manual da notificacao por escala.
- Integrar botao `Notificacao` da UI para chamar o endpoint de reenvio.
- Aplicar regras de permissao: `admin-panel` e `group-app` podem enviar; `component-app` nao pode enviar.
- Registrar resultado de envio (sucesso/falha) para observabilidade e suporte operacional.

## 5) Nao-Escopo

- Implementar novo provedor de push especifico (FCM/OneSignal) fora da abstracao da feature.
- Criar centro de notificacoes in-app (historico, leitura, inbox).
- Agendamento de notificacoes futuras ou recorrentes.
- Envio de notificacoes para usuarios nao vinculados a escala.

## 6) Usuarios e Cenarios

- Usuario-alvo:
  - Lider (`group-app`)
  - Administrador (`admin-panel`)
  - Componente (`component-app`), apenas como destinatario
- Cenarios principais:
  - Lider cria escala e os componentes selecionados recebem push imediatamente.
  - Lider abre uma escala existente e clica em `Notificacao` para reenviar.
  - Componente acessa escala, visualiza informacoes, mas nao consegue enviar notificacao.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Ao criar uma escala com sucesso (`POST /api/scales`), o backend dispara notificacao push automaticamente e de forma imediata para os componentes selecionados na escala. | Teste de integracao no endpoint de criacao com spy/mock do servico de push. | Alta |
| AC-02 | O envio automatico usa exatamente os destinatarios da escala criada (sem incluir componentes fora da lista selecionada). | Teste de integracao comparando `components[]` da escala vs destinatarios efetivos. | Alta |
| AC-03 | Falha parcial/total do push nao impede criacao da escala; a API de criacao continua retornando sucesso da escala e registra resultado do envio. | Teste de integracao simulando falha do provedor + verificacao de resposta e logs. | Alta |
| AC-04 | Existe endpoint de reenvio manual `POST /api/scales/[scaleId]/notify` que dispara notificacao para os componentes da escala informada. | Teste de integracao do endpoint com escala valida. | Alta |
| AC-05 | O botao `Notificacao` no `ScaleFeed` chama o endpoint de reenvio e apresenta feedback de sucesso/erro para o usuario. | Teste de integracao de UI (acao do botao + estado de carregamento + mensagem). | Alta |
| AC-06 | Usuario com audiencia `component-app` nao pode enviar notificacao: botao indisponivel e endpoint retorna `403` quando chamado diretamente. | Teste de UI por perfil + teste de integracao do endpoint com token `component-app`. | Alta |
| AC-07 | Usuarios `admin-panel` e `group-app` podem acionar reenvio manual com resposta de sucesso quando autorizados. | Teste de integracao por audiencia autorizada. | Alta |
| AC-08 | O payload de notificacao contem dados minimos da escala para contexto do destinatario (ex.: data, turno, identificador da escala). | Teste unitario/integracao do builder de payload. | Media |
| AC-09 | Cada tentativa de envio (automatico e manual) gera rastreio observavel com `scaleId`, audiencia solicitante, total de destinatarios, total enviado e total com falha. | Teste de integracao com inspecao de logs estruturados/retorno tecnico. | Media |

## 8) Requisitos Nao Funcionais

- Performance: disparo automatico iniciado ate 2s apos persistencia da escala em condicao local normal.
- Seguranca: bloqueio server-side obrigatorio para audiencia sem permissao (`component-app`).
- Confiabilidade: falha de envio nao pode corromper fluxo de criacao da escala.
- Observabilidade: logs estruturados para auditoria operacional de envio.
- Acessibilidade: feedback do botao `Notificacao` deve ser percebivel por teclado e leitor de tela.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Escala criada sem destinatarios validos para push (ex.: sem token cadastrado) | Escala e salva com sucesso; envio retorna `0 enviados` e log de destinatarios indisponiveis. |
| ER-02 | Provedor de push indisponivel no envio automatico | Escala e salva com sucesso; registrar falha de push e retornar sucesso da criacao da escala. |
| ER-03 | Reenvio manual para `scaleId` inexistente | Endpoint retorna `404` com mensagem de escala nao encontrada. |
| ER-04 | Usuario `component-app` chama endpoint de reenvio | Endpoint retorna `403` sem executar envio. |
| ER-05 | Usuario autorizado tenta reenviar e ocorre falha total no provedor | Endpoint retorna erro controlado (`502` ou `500` conforme padrao) e feedback claro na UI. |
| ER-06 | Escala com componentes inativos/removidos no momento do reenvio | Endpoint envia somente para destinatarios validos e reporta parcial quando aplicavel. |

## 10) Dependencias e Restricoes

- Dependencias:
  - API de escalas (`POST /api/scales` e leitura por `scaleId`).
  - Contexto de sessao/permissoes por audiencia (`AuthSessionContext` + validacao server-side).
  - Servico/abstracao de envio push (provedor externo ou adaptador interno).
  - Identificador de destino push por componente (token/subscription) em fonte de dados valida.
- Restricoes:
  - Sem token/subscription de push nao ha envio efetivo para aquele componente.
  - A feature deve conviver com estado atual da UI sem quebrar fluxo de escalas existente.

## 11) Suposicoes

- Cada componente participante possui identificador de destino push disponivel no backend (direto ou derivado).
- A autenticacao por JWT ja diferencia audiencias `admin-panel`, `group-app` e `component-app`.
- O botao `Notificacao` deve permanecer visivel no fluxo atual, com acao real para perfis autorizados.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01, AC-02, AC-03 | T-01, T-02, T-03, T-07 |
| AC-04, AC-07 | T-04, T-07 |
| AC-05 | T-05 |
| AC-06 | T-04, T-05, T-06 |
| AC-08 | T-01 |
| AC-09 | T-03, T-04, T-07 |
