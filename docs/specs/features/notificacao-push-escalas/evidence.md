# Evidencias - notificacao-push-escalas

## Implementacao / Arquivos impactados

- Backend (criacao + disparo automatico): `src/app/api/scales/route.js`
- Backend (reenvio manual): `src/app/api/scales/[scaleId]/notify/route.js`
- Backend (servico de notificacao push): `src/lib/notifications/scalePushNotifications.js`
- Backend (colecao + indices): `src/lib/db/mongodb.js`
- Frontend (acao real do botao): `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
- Documentacao da feature:
  - `docs/specs/features/notificacao-push-escalas/spec.md`
  - `docs/specs/features/notificacao-push-escalas/plan.md`
  - `docs/specs/features/notificacao-push-escalas/validation.md`
  - `docs/specs/features/notificacao-push-escalas/evidence.md`

## Cobertura funcional entregue

- Criacao de escala (`POST /api/scales`) dispara notificacao automaticamente para os componentes selecionados.
- Botao `Notificacao` no feed reenvia notificacao via endpoint dedicado.
- Perfil `component-app` segue bloqueado para envio (UI e backend).
- Cada envio (automatico/manual) gera trilha de auditoria com contadores e metadados operacionais.

## Validacoes executadas

- Lint direcionado dos arquivos alterados:
  - `npm run lint -- --file src/app/api/scales/route.js --file src/app/api/scales/[scaleId]/notify/route.js --file src/lib/notifications/scalePushNotifications.js --file src/lib/db/mongodb.js --file src/components/organisms/ScaleFeed/ScaleFeed.jsx`
  - Resultado: sem erros e sem warnings.

## Observacoes de status

- O servico suporta envio externo via webhook quando configurado por ambiente:
  - `SCALE_PUSH_WEBHOOK_URL` ou `PUSH_NOTIFICATIONS_WEBHOOK_URL`.
- Sem webhook configurado, a feature opera em `audit-only`, com contabilizacao e rastreio completos de dispatch.
