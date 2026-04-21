# Evidencias - pwa-instalavel-dispositivos

## Implementacao / Arquivos impactados

- Manifest e metadata PWA:
  - `src/app/manifest.js`
  - `src/app/layout.js`
- Registro global de service worker:
  - `src/components/PwaServiceWorkerRegistration.jsx`
  - `src/lib/pwa/registerAppServiceWorker.js`
- Compatibilidade push com registro unico do SW:
  - `src/lib/notifications/registerClientPushSubscription.js`
- Service worker com cache baseline e push:
  - `public/push-sw.js`
- Acao de instalacao desktop:
  - `src/components/organisms/MainBottomNav/MainBottomNav.jsx`
- Assets de icones:
  - `public/icons/icon-192.png`
  - `public/icons/icon-512.png`
  - `public/icons/apple-touch-icon.png`

## Cobertura funcional entregue

- Aplicacao instalavel como PWA em mobile e desktop (quando browser suportar).
- Prompt/acao de instalacao desktop via menu do usuario.
- Service worker registrado automaticamente e reutilizado no fluxo de push.
- Cache baseline para shell e recursos estaticos, sem interceptar chamadas `/api`.

## Validacoes executadas

- `npm run lint`
  - Resultado: sem erros e sem warnings.
- `npm run build`
  - Resultado: build de producao concluida com sucesso, incluindo rota `/manifest.webmanifest`.

## Observacoes de status

- A instalacao desktop depende de requisitos de navegador e contexto seguro (HTTPS) no ambiente final.
- O suporte a iOS segue o fluxo nativo do Safari (adicionar a tela inicial), sem evento `beforeinstallprompt`.
