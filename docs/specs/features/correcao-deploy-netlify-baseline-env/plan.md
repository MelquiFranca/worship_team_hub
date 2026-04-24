# Plano Tecnico - correcao-deploy-netlify-baseline-env

## 1) Referencia da Spec

- Feature: correcao-deploy-netlify-baseline-env
- Documento: `features/correcao-deploy-netlify-baseline-env/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Aplicar correcao enxuta e segura em tres frentes: (1) configuracao versionada do Netlify, (2) feedback de erro mais acionavel no bootstrap, (3) documentacao operacional para reduzir erro humano em deploy.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Adicionar `netlify.toml` com `build.command = \"npm run build\"` e plugin Next.js. | AC-01 | Revisao manual | Arquivo versionado no repo |
| T-02 | Ajustar `next.config.mjs` para falhar com mensagem explicita quando detectar `next start` em contexto de build Netlify. | AC-02 | Manual | Trecho de codigo + simulacao de mensagem |
| T-03 | Atualizar `README.md` e `docs/setup/production-env-secrets.md` com checklist objetivo de deploy Netlify e segredos obrigatorios. | AC-03 | Revisao documental | Diff de documentacao |
| T-04 | Executar validacao tecnica minima (`npm run lint` e `npm run build`) e registrar resultado. | AC-01, AC-02, AC-03 | Lint/Build | Logs de comandos |

## 4) Ordem de Execucao

1. Implementar configuracao versionada do Netlify.
2. Implementar mensagem acionavel no bootstrap/config.
3. Atualizar documentacao operacional.
4. Executar validacao e registrar em `validation.md`.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Conflito entre configuracao em arquivo e configuracao UI do Netlify | Medio | Alta | Documentar que UI pode sobrescrever `netlify.toml` e orientar ajuste direto no painel. |
| Mudanca indevida no baseline reduzir seguranca | Alto | Baixa | Nao alterar regras de segredos obrigatorios; apenas melhorar diagnostico e orientacao. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: manter deploy com configuracao atual e ajustar manualmente comando/env no painel.
- Plano de rollback: reverter commit se houver regressao inesperada de bootstrap.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regresses criticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-23 | Manter baseline fail fast e corrigir apenas ergonomia de deploy | Preservar hardening de seguranca ja aprovado | Evita aliviar regra critica de producao |
| 2026-04-23 | Versionar `netlify.toml` com comando de build correto | Reduzir erro operacional recorrente de setup | Deploy mais previsivel em novos ambientes |
