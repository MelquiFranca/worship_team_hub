# Setup de Ambiente Next.js

## Objetivo

Padronizar o ambiente local para desenvolvimento da aplicacao Next.js.

## 1. Runtime

- Versao de Node obrigatoria: `22.14.0`
- Arquivo de referencia: `.nvmrc`

Com `nvm`:

```bash
nvm use
```

## 2. Instalacao de dependencias

```bash
npm install
```

## 3. Variaveis de ambiente

1. Copie o arquivo exemplo:

```bash
cp .env.example .env.local
```

2. Ajuste os valores de acordo com o ambiente.

## 4. Execucao local

```bash
npm run dev
```

A aplicacao deve ficar disponivel em `http://localhost:3000`.

## 5. Validacao minima de baseline

Execute:

```bash
npm run lint
npm run build
```

Ambos os comandos devem finalizar sem erro antes de iniciar novas features.

## 6. Troubleshooting rapido

- Erro de versao do Node: valide com `node -v` e rode `nvm use`.
- Erro de dependencias: remova `node_modules` e rode `npm install` novamente.
- Erro de variaveis: confira se `.env.local` foi criado a partir de `.env.example`.
