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

## Upload de imagem de componente

- O upload de foto agora e persistido no MongoDB dentro do proprio documento de `components`.
- A API aceita `photoDataUrl` (data URL base64) e salva os metadados/binario em `components.photo`.
- Tipos aceitos: `image/jpeg`, `image/png`, `image/webp` e `image/gif`.
- Limite de tamanho: `2MB` por imagem.
- Compatibilidade legado: `photoUrl` continua sendo retornado e aceito como fallback.
- Para remocao da imagem no `PATCH`, envie `photoDataUrl: null` ou `photoDataUrl: ""`.

## Upload de imagem do grupo

- As configuracoes gerais do grupo agora sao persistidas em banco na colecao `group_settings`.
- A rota `GET/PATCH /api/group-settings` salva nome, foto, funcoes e tema por `groupId`.
- A foto do grupo tambem usa `photoDataUrl` com persistencia no banco e fallback de `photoUrl`.
- Tipos aceitos e limite seguem o padrao: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, ate `2MB`.

## Imagens das escalas no banco (consulta e reuso)

- O campo `scales.imageAttachment` agora e persistido no MongoDB com suporte a imagem base64 (`data URL`) ou URL HTTP/HTTPS.
- A API `POST/PATCH /api/scales` aceita `imageAttachment`; no `PATCH`, enviar `imageAttachment: null` remove a imagem da escala.
- A API `GET /api/scales` retorna `imageAttachment` serializado para consumo direto da UI.
- A API `GET /api/scales/images` lista a biblioteca de imagens de todas as escalas do grupo para consulta/reutilizacao em novas escalas.
- Regras de upload para imagem base64 da escala: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, limite de `2MB`.

## Playlist da escala (execucao sequencial automatica)

- O player da aba de playlist no feed (`/escalas`) suporta execucao sequencial automatica para links do YouTube.
- Ao finalizar um video, o proximo da escala e executado automaticamente quando a opcao de autoplay estiver ativa.
- O usuario pode ativar/desativar essa automacao por card usando o controle `Executar playlist automaticamente em sequencia`.
- Para evitar falhas de reproducao na fila automatica, entram apenas IDs validos de video do YouTube extraidos da URL.
- Links nao-YouTube (ex.: Vimeo) continuam suportados no player, mas sem fila sequencial automatica.

## Listagem administrativa de grupos

- A tela `/admin/grupos` nao usa mais dados ficticios em codigo.
- A listagem agora e carregada diretamente do MongoDB (colecao `groups`).
- A foto de cada grupo prioriza `group_settings.photo/photoUrl`, com fallback para `groups.photoUrl`.
- Quando nao ha foto, a interface exibe placeholder com as iniciais do grupo.

## Notificacao Push (Service Worker Nativo)

- A aplicacao usa Web Push nativo com Service Worker e VAPID.
- Configure no `.env.local`:
  - `PUSH_VAPID_PUBLIC_KEY`
  - `PUSH_VAPID_PRIVATE_KEY`
  - `PUSH_VAPID_SUBJECT` (ex.: `mailto:seu-email@dominio.com`)
- O cliente (`component-app`) registra `PushSubscription` automaticamente via `PushManager`.
- O backend envia notificacoes usando `web-push` diretamente para as subscriptions salvas dos componentes.
- Sem chaves VAPID configuradas, os envios ficam desabilitados e a tentativa e registrada como falha de configuracao.
- node -e "const webpush=require('web-push'); console.log(webpush.generateVAPIDKeys())"

## Documentacao

- Fluxo detalhado: `docs/setup/next-setup.md`
- Spec da feature: `docs/specs/features/configurar-ambiente-next/`
- Spec de imagem em banco: `docs/specs/features/armazenamento-imagem-banco-componentes/`
- Spec de imagem de escalas em banco: `docs/specs/features/persistencia-imagens-escalas-banco/`
- Spec de integracao da listagem de grupos no banco: `docs/specs/features/integracao-grupos-admin-banco/`
- Spec da execucao automatica da playlist da escala: `docs/specs/features/autoplay-playlist-escala/`
