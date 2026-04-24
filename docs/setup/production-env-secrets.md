# Runbook - Baseline de Producao e Segredos

## Objetivo

Padronizar provisionamento, validacao pre-deploy e rotacao de segredos para ambiente de producao, com base nas variaveis efetivamente consumidas em runtime.

## Inventario de variaveis (runtime)

| Variavel | Classificacao | Obrigatoriedade | Observacao operacional |
| --- | --- | --- | --- |
| `MONGODB_URI` | required, sensitive | Obrigatoria | Sem valor valido, APIs com banco falham. |
| `MONGODB_DB_NAME` | optional, public | Opcional | Fallback interno: `escalas_app`. |
| `NODE_ENV` | optional, public | Opcional | Geralmente controlada pela plataforma (`production` em deploy). |
| `AUTH_JWT_SECRET` | required, sensitive | Obrigatoria em conjunto | Definir esta ou `JWT_SECRET` (32+ chars aleatorios). |
| `JWT_SECRET` | required, sensitive | Obrigatoria em conjunto | Definir esta ou `AUTH_JWT_SECRET` (32+ chars aleatorios). |
| `AUTH_SECRET` | optional, sensitive | Opcional | Fallback legado para verificacao de token no middleware. |
| `SESSION_SECRET` | optional, sensitive | Opcional | Fallback legado para verificacao de token no middleware. |
| `NEXTAUTH_SECRET` | optional, sensitive | Opcional | Fallback legado para verificacao de token no middleware. |
| `AUTH_JWT_PUBLIC_KEY` | optional, public | Opcional | Usada quando JWT assimetrico (RS256). |
| `JWT_PUBLIC_KEY` | optional, public | Opcional | Usada quando JWT assimetrico (RS256). |
| `AUTH_PUBLIC_KEY` | optional, public | Opcional | Usada quando JWT assimetrico (RS256). |
| `AUTH_JWT_ISSUER` | optional, public | Opcional | Issuer esperado no middleware. |
| `JWT_ISSUER` | optional, public | Opcional | Fallback de issuer no middleware. |
| `AUTH_REFRESH_STORE` | optional, public | Opcional | `memory` apenas para testes/ambiente efemero. |
| `AUTH_COOKIE_NAME` | optional, public | Opcional | Alias de cookie para leitura de token no middleware. |
| `AUTH_ACCESS_COOKIE_NAME` | optional, public | Opcional | Alias de cookie para leitura de token no middleware. |
| `AUTH_JWT_COOKIE_NAME` | optional, public | Opcional | Alias de cookie para leitura de token no middleware. |
| `YOUTUBE_API_KEY` | conditional, sensitive | Condicional | Obrigatoria quando recurso/endpoints YouTube estiverem habilitados ou acionados. Nao bloqueia bootstrap inicial sem uso do recurso. |
| `RATE_LIMIT_ENABLED` | optional, public | Opcional | Flag global de rate limit. |
| `RATE_LIMIT_AUTH_ENABLED` | optional, public | Opcional | Flag de rate limit para auth. |
| `RATE_LIMIT_INTEGRATIONS_ENABLED` | optional, public | Opcional | Flag de rate limit para integracoes. |
| `RATE_LIMIT_AUTH_LOGIN_MAX` | optional, public | Opcional | Limite de tentativas de login. |
| `RATE_LIMIT_AUTH_LOGIN_WINDOW_SECONDS` | optional, public | Opcional | Janela do limite de login. |
| `RATE_LIMIT_AUTH_REFRESH_MAX` | optional, public | Opcional | Limite de refresh token. |
| `RATE_LIMIT_AUTH_REFRESH_WINDOW_SECONDS` | optional, public | Opcional | Janela do limite de refresh. |
| `RATE_LIMIT_YOUTUBE_SEARCH_MAX` | optional, public | Opcional | Limite para busca YouTube. |
| `RATE_LIMIT_YOUTUBE_SEARCH_WINDOW_SECONDS` | optional, public | Opcional | Janela da busca YouTube. |
| `RATE_LIMIT_YOUTUBE_PREVIEW_MAX` | optional, public | Opcional | Limite para preview YouTube. |
| `RATE_LIMIT_YOUTUBE_PREVIEW_WINDOW_SECONDS` | optional, public | Opcional | Janela do preview YouTube. |
| `RATE_LIMIT_STORE_FORCE_FAILURE` | optional, public | Opcional | Somente para testes controlados de falha. |
| `PUSH_VAPID_PUBLIC_KEY` | optional, public | Condicional | Necessaria para registrar push no cliente. |
| `PUSH_VAPID_PRIVATE_KEY` | optional, sensitive | Condicional | Necessaria para envio Web Push no backend. |
| `PUSH_VAPID_SUBJECT` | optional, public | Condicional | Contato operacional no formato `mailto:`. |

## Provisionamento de producao

1. Criar baseline local sem segredos reais:
```bash
cp .env.example .env.production.local
```

2. Gerar segredo JWT forte (exemplo):
```bash
openssl rand -base64 48 | tr -d '\n'
```

3. Gerar par VAPID (se push estiver habilitado):
```bash
node -e "const webpush=require('web-push'); console.log(webpush.generateVAPIDKeys())"
```

4. Registrar segredos no cofre da plataforma (GitHub Environment Secrets, Vault, SSM, etc):
- `MONGODB_URI`
- `AUTH_JWT_SECRET` ou `JWT_SECRET`
- `PUSH_VAPID_PRIVATE_KEY` (quando push estiver habilitado)

5. Registrar `YOUTUBE_API_KEY` no cofre quando a integracao YouTube estiver habilitada no ambiente:
- `YOUTUBE_API_KEY`

6. Publicar variaveis operacionais no ambiente:
- `MONGODB_DB_NAME`
- `AUTH_JWT_ISSUER` (quando exigencia de issuer estiver ativa)
- `RATE_LIMIT_*`
- `PUSH_VAPID_PUBLIC_KEY` e `PUSH_VAPID_SUBJECT` (quando push estiver habilitado)

## Validacao pre-deploy

1. Validar cobertura de inventario de env no codigo:
```bash
rg -n "process\.env" src
```
Esperado: apenas variaveis listadas neste runbook e no `.env.example`.

2. Validar que baseline invalido dispara erro de configuracao para obrigatorias de bootstrap:
```bash
NODE_ENV=production AUTH_JWT_SECRET= JWT_SECRET= MONGODB_URI=mongodb://localhost:27017/escalas_app_local node --experimental-default-type=module --input-type=module -e "import { validateProductionEnvironment } from './src/lib/env/productionBaseline.mjs'; validateProductionEnvironment(process.env);"
```
Esperado: processo encerra com erro contendo `JWT_SECRET_MISSING`.

3. Validar que ausencia de `YOUTUBE_API_KEY` nao bloqueia bootstrap sem uso inicial de integracao:
```bash
NODE_ENV=production AUTH_JWT_SECRET=replace-with-32-plus-random-chars MONGODB_URI=mongodb://localhost:27017/escalas_app_local node --experimental-default-type=module --input-type=module -e "import { validateProductionEnvironment } from './src/lib/env/productionBaseline.mjs'; validateProductionEnvironment(process.env); console.log('BASELINE_OK');"
```
Esperado: `BASELINE_OK`.

4. Validar baseline valido em producao com integracao YouTube habilitada:
```bash
NODE_ENV=production AUTH_JWT_SECRET=replace-with-32-plus-random-chars YOUTUBE_API_KEY=replace-with-youtube-api-key MONGODB_URI=mongodb://localhost:27017/escalas_app_local node --experimental-default-type=module --input-type=module -e "import { validateProductionEnvironment } from './src/lib/env/productionBaseline.mjs'; validateProductionEnvironment(process.env); console.log('BASELINE_OK');"
```
Esperado: `BASELINE_OK`.

5. Executar gate tecnico minimo:
```bash
npm run lint
npm run build
npm run test:auth
npm run test:smoke
```
Esperado: todos os comandos finalizam com exit code 0.

## Rotacao baseline de segredos

### Quando rotacionar

- Periodicamente (exemplo: a cada 90 dias).
- Imediatamente apos suspeita de vazamento.
- Sempre que houver troca de equipe com acesso administrativo ao ambiente.

### Procedimento de rotacao (JWT e segredos sensiveis)

1. Gerar novo segredo com entropia alta.
2. Publicar novo segredo no cofre do ambiente de `staging`.
3. Rodar validacao pre-deploy completa em `staging`.
4. Promover para `production` em janela de mudanca.
5. Monitorar erros `AUTH_CONFIG_MISSING`, `AUTH_TOKEN_INVALID`, `AUTH_TOKEN_EXPIRED` por 30 minutos.

Observacao: a implementacao atual usa segredo unico ativo para assinatura/verificacao JWT. A rotacao invalida sessoes antigas e pode forcar novo login.

### Rollback de emergencia

1. Reaplicar segredo anterior no cofre de `production`.
2. Reiniciar/redeploy da aplicacao.
3. Reexecutar:
```bash
npm run test:auth
npm run test:smoke
```

## Nota operacional - Netlify

- Build command correto: `npm run build`.
- Nao usar `npm start` no campo de build da plataforma; `next start` e comando de runtime e pode falhar no bootstrap por baseline incompleto.
- Garantir no painel do site (Site configuration > Environment variables), no minimo:
  - `MONGODB_URI`
  - `AUTH_JWT_SECRET` ou `JWT_SECRET`
- Se `YOUTUBE_API_KEY` for necessaria no ambiente, provisionar tambem antes do deploy.
- Observacao: valores configurados na UI podem prevalecer sobre `netlify.toml`.

## Checklist operacional

- [ ] `.env.example` atualizado e sem segredos reais.
- [ ] Cofre de segredos provisionado para `staging` e `production`.
- [ ] `YOUTUBE_API_KEY` provisionada quando a integracao YouTube estiver habilitada.
- [ ] Validacao pre-deploy executada e registrada.
- [ ] Rotacao testada em `staging` antes de producao.
- [ ] Risco de invalidez de sessao comunicado ao time de suporte.
