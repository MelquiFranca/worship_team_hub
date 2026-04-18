# Escalas App

Aplicacao base em Next.js com App Router.

## Pre-requisitos

- Node.js `22.14.0` (arquivo `.nvmrc`)
- npm `>=10`

## Setup rapido

1. Instale dependencias:
   ```bash
   npm install
   ```
2. Copie variaveis de ambiente:
   ```bash
   cp .env.example .env.local
   ```
3. Rode em desenvolvimento:
   ```bash
   npm run dev
   ```
4. Abra `http://localhost:3000`.

## Scripts

- `npm run dev`: inicia ambiente de desenvolvimento.
- `npm run build`: gera build de producao.
- `npm run start`: inicia servidor de producao.
- `npm run lint`: executa lint.

## Notificacao Push (Service Worker Nativo)

- A aplicacao usa Web Push nativo com Service Worker e VAPID.
- Configure no `.env.local`:
  - `PUSH_VAPID_PUBLIC_KEY`
  - `PUSH_VAPID_PRIVATE_KEY`
  - `PUSH_VAPID_SUBJECT` (ex.: `mailto:seu-email@dominio.com`)
- O cliente (`component-app`) registra `PushSubscription` automaticamente via `PushManager`.
- O backend envia notificacoes usando `web-push` diretamente para as subscriptions salvas dos componentes.
- Sem chaves VAPID configuradas, os envios ficam desabilitados e a tentativa e registrada como falha de configuracao.

## Documentacao

- Fluxo detalhado: `docs/setup/next-setup.md`
- Spec da feature: `docs/specs/features/configurar-ambiente-next/`
