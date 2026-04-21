# Plano Tecnico - pwa-instalavel-dispositivos

## 1) Referencia da Spec

- Feature: pwa-instalavel-dispositivos
- Documento: `features/pwa-instalavel-dispositivos/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Aplicar PWA de forma incremental e sem conflito com o fluxo de push ja existente:

1. Adicionar metadados/manifest e icones para atender criterios de instalabilidade.
2. Reutilizar um unico service worker para cache basico e push notifications.
3. Registrar SW na carga da app e reutilizar registro no fluxo de inscricao de push.
4. Expor CTA de instalacao para desktop no menu do usuario via `beforeinstallprompt`.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Criar `src/app/manifest.js` com propriedades de PWA e icones | AC-01 | Build + Manual | Rota `/manifest.webmanifest` gerada |
| T-02 | Gerar icones PWA (`192`, `512`, `apple-touch-icon`) e referenciar no layout | AC-01 | Manual | Arquivos em `public/icons/` + metadata |
| T-03 | Registrar service worker automaticamente no client app | AC-02 | Manual | `PwaServiceWorkerRegistration` + util de registro |
| T-04 | Atualizar fluxo de push para reutilizar o registro unico do SW | AC-03 | Validacao de codigo + Manual | Ajuste em `registerClientPushSubscription` |
| T-05 | Adicionar acao `Instalar app` para desktop via `beforeinstallprompt` | AC-04 | Manual | Botao no menu do avatar |
| T-06 | Executar validacao final (`lint`, `build`) e registrar documentos SDD | AC-05 | Manual | Saidas de `npm run lint` e `npm run build` |

## 4) Ordem de Execucao

1. Manifest, metadata e icones (T-01, T-02).
2. Registro SW global e compatibilidade com push (T-03, T-04).
3. UX de instalacao desktop (T-05).
4. Validacao final e documentacao (T-06).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Conflito entre cache do SW e chamadas autenticadas | Alto | Media | Ignorar `/api` no `fetch` handler do SW. |
| Duplo registro de service worker | Medio | Media | Centralizar registro em util compartilhado. |
| Botao de instalar gerar expectativa em browser sem suporte | Medio | Media | Exibir CTA apenas quando `beforeinstallprompt` estiver disponivel. |
| Regressao no fluxo de push | Alto | Baixa | Reaproveitar mesmo SW e manter validacao de permissao atual. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: manter operacao web sem instalacao se navegador nao suportar.
- Plano de rollback: remover registro automatico de SW e CTA desktop, preservando fluxo anterior.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressoes criticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-21 | Usar um unico service worker (`/push-sw.js`) para PWA e push | Evitar conflitos e complexidade de multiplos SWs | Menor risco de inconsistencias no cliente |
| 2026-04-21 | Expor instalacao desktop no menu de avatar | Tornar descoberta de instalacao explicita no desktop | Melhora conversao de instalacao em computador |
| 2026-04-21 | Adicionar `display_override` no manifest | Melhor compatibilidade com shell de janela em desktop | UX desktop mais nativa quando suportado |
