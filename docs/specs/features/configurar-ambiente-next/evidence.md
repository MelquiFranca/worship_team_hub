# Evidencias - configurar-ambiente-next

## Ambiente local

- `node -v`: `v22.14.0`
- `npm -v`: `10.9.2`

## Dependencias

- Comando executado: `npm install --cache /tmp/escalas-app-npm-cache`
- Resultado: instalacao concluida com sucesso (`added 298 packages`, `found 0 vulnerabilities`).
- Artefatos gerados: `node_modules/`, `package-lock.json`.

## Execucao em desenvolvimento

- Comando executado: `npm run dev -- --hostname 127.0.0.1 --port 3000`
- Validacao HTTP local: resposta `200` em `http://127.0.0.1:3000`.

## Qualidade tecnica

- `npm run lint`: sem warnings/erros.
- `npm run build`: build concluido com sucesso em Next.js `15.5.15`.

## Arquivos principais implementados

- `package.json` com scripts `dev`, `build`, `start`, `lint`.
- `.nvmrc` com versao de Node padronizada.
- `.env.example` com variaveis base.
- `README.md` e `docs/setup/next-setup.md` com onboarding.
- Estrutura inicial do App Router em `src/app`.
