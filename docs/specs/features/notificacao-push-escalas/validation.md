# Validacao - notificacao-push-escalas

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | `POST /api/scales` integrado ao `dispatchScalePushNotifications` apos `insertOne`. | Disparo automatico executado imediatamente no fluxo de criacao. |
| AC-02 | Pass | Destinatarios resolvidos a partir de `scale.components[].componentId` no servico de push. | Componentes fora da escala nao sao incluidos. |
| AC-03 | Pass | Falha de notificacao no `POST /api/scales` nao interrompe resposta `201` da escala. | API retorna escala criada e status de notificacao no payload. |
| AC-04 | Pass | Endpoint `POST /api/scales/[scaleId]/notify` criado e funcional. | Reenvio manual por `scaleId` implementado. |
| AC-05 | Pass | Botao `Notificacao` no `ScaleFeed` chama endpoint real com estado de carregamento e feedback. | Sem duplo clique durante envio. |
| AC-06 | Pass | UI mantem bloqueio para `component-app` e backend retorna `403` para reenvio por esse perfil. | Defesa em profundidade (frontend + backend). |
| AC-07 | Pass | Audiencias `admin-panel` e `group-app` permitidas no endpoint de reenvio. | Fluxo autorizado mantido conforme politica existente. |
| AC-08 | Pass | Payload de dispatch inclui `scale.id`, `groupId`, `date`, `shift`, trigger e ator. | Dados minimos de contexto presentes no envio. |
| AC-09 | Pass | Registro de auditoria em `scale_push_notification_dispatches` com contadores e metadados. | Estado agregado salvo em `notifications.push` na escala. |

## Resultado final

- Status: Concluida
- Data: 2026-04-18
- Responsavel: Codex

## Pendencias e Riscos Residuais

- O envio esta em modo `audit-only` quando `SCALE_PUSH_WEBHOOK_URL` (ou `PUSH_NOTIFICATIONS_WEBHOOK_URL`) nao estiver configurada.
- Para entrega push externa real, e necessario configurar webhook/provedor e garantir tokens de destino por componente.
