# Spec Funcional - correcao-deploy-netlify-baseline-env

## 1) Contexto

- Data: 2026-04-23
- Autor(a): Codex (GPT-5)
- Status: Implemented
- Stakeholders: Engenharia, DevOps

## 2) Problema

Deploy em producao no Netlify esta sendo executado com `npm start` como build command. Isso dispara `next start` durante a fase de build e faz o baseline de ambiente falhar por falta de segredos obrigatorios (`MONGODB_URI` e `AUTH_JWT_SECRET`/`JWT_SECRET`), bloqueando a publicacao com diagnostico incompleto de configuracao da plataforma.

## 3) Objetivo

Reduzir falhas de configuracao de deploy no Netlify, tornando explicito no repositorio o comando correto de build e os segredos obrigatorios, com mensagem acionavel para erro de comando incorreto.

## 4) Escopo

- Definir configuracao versionada de deploy Netlify com build command correto.
- Melhorar mensagem de erro no bootstrap quando `next start` for usado como build command no Netlify.
- Documentar checklist objetivo de variaveis obrigatorias e comando de build para Netlify.

## 5) Nao-Escopo

- Provisionar segredos automaticamente no painel do Netlify.
- Alterar politica de seguranca do baseline de producao (fail fast para segredos obrigatorios).

## 6) Usuarios e Cenarios

- Usuario-alvo: engenheiros responsaveis por deploy no Netlify.
- Cenarios principais:
  - Configurar novo site Netlify com build command incorreto por engano.
  - Corrigir ambiente que falha por ausencia de segredos obrigatorios no baseline de producao.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | O repositorio explicita configuracao Netlify com build command `npm run build`. | Revisao de arquivo `netlify.toml`. | Alta |
| AC-02 | Ao detectar execucao de `next start` no contexto de build Netlify, o erro informa acao corretiva direta (`npm run build`). | Execucao manual de bootstrap/config em ambiente simulado + revisao de mensagem no codigo. | Alta |
| AC-03 | Runbook/README documentam segredos obrigatorios de producao para o baseline (`MONGODB_URI` e `AUTH_JWT_SECRET`/`JWT_SECRET`) e checklist de deploy Netlify. | Revisao documental. | Media |

## 8) Requisitos Nao Funcionais

- Performance: sem impacto relevante de runtime.
- Seguranca: manter validacao fail fast de segredos obrigatorios em producao.
- Acessibilidade: nao aplicavel.
- Observabilidade: erro de configuracao deve ser acionavel e objetivo.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Build command do Netlify definido como `npm start` | Processo falha com mensagem orientando configurar `npm run build` no build command. |
| ER-02 | `MONGODB_URI` ausente em producao | Baseline falha com erro explicito `MONGODB_URI_MISSING`. |
| ER-03 | `AUTH_JWT_SECRET` e `JWT_SECRET` ausentes em producao | Baseline falha com erro explicito `JWT_SECRET_MISSING`. |

## 10) Dependencias e Restricoes

- Dependencias: Next.js 15, plugin `@netlify/plugin-nextjs`.
- Restricoes: manter compatibilidade com pipeline atual sem reduzir hardening de seguranca.

## 11) Suposicoes

- O deploy alvo usa Netlify com plugin oficial Next.js.
- O time controla variaveis de ambiente de producao no painel da plataforma.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-02 |
| AC-03 | T-03 |
