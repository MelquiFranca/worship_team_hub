# Spec Funcional - pwa-instalavel-dispositivos

## 1) Contexto

- Data: 2026-04-21
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, UX

## 2) Problema

A aplicacao web nao oferecia instalacao consistente como app no dispositivo do usuario. Sem manifest completo, sem registro global de service worker e sem ponto de instalacao no desktop, usuarios dependiam apenas do navegador em modo aba.

## 3) Objetivo

Permitir que a aplicacao seja instalavel como PWA em dispositivos moveis e desktop, com prompt de instalacao suportado e comportamento baseline offline sem quebrar notificacoes push existentes.

## 4) Escopo

- Adicionar manifest PWA completo no App Router.
- Publicar icones para Android e Apple touch icon.
- Registrar service worker no carregamento da aplicacao.
- Manter compatibilidade do fluxo de push com o mesmo service worker.
- Expor acao de instalacao no desktop quando `beforeinstallprompt` estiver disponivel.

## 5) Nao-Escopo

- Implementar modo offline funcional para todas as telas e APIs autenticadas.
- Criar onboarding visual dedicado de instalacao por sistema operacional.
- Cobrir instalacao em navegadores sem suporte a PWA install prompt.

## 6) Usuarios e Cenarios

- Usuario-alvo: componentes e lideres que acessam a aplicacao no celular e no computador.
- Cenarios principais:
  - Usuario em Android instala a aplicacao pelo prompt do navegador.
  - Usuario em desktop (Chrome/Edge/Brave) instala via opcao `Instalar app` no menu.
  - Usuario autenticado continua recebendo push sem regressao apos instalacao.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | A aplicacao expoe `manifest.webmanifest` com `display: standalone`, `start_url`, `scope`, `theme_color` e icones 192/512. | Build e acesso a rota `/manifest.webmanifest`. | Alta |
| AC-02 | O service worker e registrado ao carregar a aplicacao, sem depender do fluxo de permissao de push. | Validacao manual no browser (Application > Service Workers). | Alta |
| AC-03 | O fluxo de notificacao push continua funcional usando o mesmo registro de service worker. | Validacao de codigo + fluxo manual de inscricao push. | Alta |
| AC-04 | Em desktop com suporte a `beforeinstallprompt`, existe acao explicita para instalar o app. | Validacao manual no menu de avatar e disparo de `prompt()`. | Alta |
| AC-05 | Lint e build da aplicacao concluem sem erros apos as mudancas da feature. | `npm run lint` e `npm run build`. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: registro de SW nao deve bloquear renderizacao inicial.
- Seguranca: nao interceptar chamadas `/api` no cache do service worker.
- Confiabilidade: falha de registro de SW nao deve quebrar sessao nem navegacao.
- Acessibilidade: acao de instalacao deve ser acionavel por teclado.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Navegador sem suporte a service worker | Aplicacao segue funcional sem PWA, sem quebra de UI. |
| ER-02 | Falha ao registrar service worker | Erro e absorvido; app continua operando no modo web. |
| ER-03 | Navegador desktop sem `beforeinstallprompt` | Botao de instalar nao e exibido e uso segue normal. |
| ER-04 | Push sem permissao concedida | Instalacao continua possivel; push permanece desabilitado. |

## 10) Dependencias e Restricoes

- Dependencias: Next.js App Router, arquivos estaticos em `public/`, fluxo de autenticacao/push existente.
- Restricoes: suporte de instalacao desktop depende do navegador e do criterio de instalabilidade da PWA.

## 11) Suposicoes

- Usuarios desktop usam navegadores Chromium com suporte a install prompt.
- A aplicacao roda em HTTPS em ambiente produtivo.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02, AC-03 | T-03, T-04 |
| AC-04 | T-05 |
| AC-05 | T-06 |
