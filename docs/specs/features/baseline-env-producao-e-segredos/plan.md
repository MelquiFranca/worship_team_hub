# Plano Tecnico - baseline-env-producao-e-segredos

## 1) Referencia da Spec

- Feature: baseline-env-producao-e-segredos
- Documento: `features/baseline-env-producao-e-segredos/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Implementar em ondas curtas com foco em seguranca e previsibilidade de deploy:

1. Descobrir e consolidar inventario real de variaveis de ambiente no codigo.
2. Atualizar baseline documental (`.env.example` + guia operacional) sem segredos reais e com requisitos condicionais explicitos.
3. Aplicar validacao de bootstrap para bloquear execucao insegura em producao apenas para obrigatorias de inicializacao.
4. Executar regressao de autenticacao e pipeline de qualidade para confirmar nao regressao.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Mapear todas as referencias `process.env` e classificar por dominio (auth, jwt, youtube, app). | AC-01 | Revisao tecnica | Inventario versionado em documento tecnico |
| T-02 | Definir matriz de obrigatoriedade (`required/optional/conditional`) e criticidade (`sensitive/public`) por variavel. | AC-01, AC-02 | Revisao tecnica | Tabela consolidada validada por backend/devops |
| T-03 | Atualizar `.env.example` com cobertura completa e placeholders seguros, removendo ambiguidades. | AC-02 | Revisao + checklist | Diff de `.env.example` aprovado |
| T-04 | Implementar validacao de ambiente no bootstrap para falhar rapido em producao quando obrigatorias de bootstrap faltarem/forem invalidas, sem bloquear por integracao opcional nao usada no startup. | AC-03 | Integracao/Manual | Logs de boot com matriz de cenarios validos/invalidos |
| T-05 | Remover/neutralizar fallback inseguro de segredos em runtime e padronizar mensagem de erro de seguranca, incluindo guarda de configuracao quando recurso condicional for acionado. | AC-04 | Revisao de codigo + teste manual | Evidencia de que producao nao aceita segredo default |
| T-06 | Criar/atualizar runbook operacional com provisionamento, checklist pre-deploy e rotacao baseline de segredos. | AC-05 | Revisao documental | Documento revisado por engenharia/DevOps |
| T-07 | Executar `lint`, `build` e smoke test de login/refresh para validar estabilidade apos mudancas. | AC-06 | Manual/CI | Logs e resultados registrados em `validation.md` |

## 4) Ordem de Execucao

1. Inventario e classificacao (T-01, T-02).
2. Baseline de configuracao e documentacao (T-03, T-06).
3. Guardrails de bootstrap e seguranca (T-04, T-05).
4. Regressao funcional e fechamento de evidencias (T-07).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Variavel usada em runtime nao mapeada no inventario | Alto | Media | Automatizar busca de `process.env` + revisao cruzada por modulo. |
| Endurecimento de validacao quebrar ambiente legado de homologacao | Medio | Media | Introduzir matriz por ambiente e executar smoke test antes do merge. |
| Exposicao acidental de segredo em logs/documentacao | Alto | Baixa | Redigir placeholders mascarados e revisar logs para nao imprimir valores. |
| Mudancas de auth impactarem login/refresh | Alto | Media | Rodar smoke tests direcionados de autenticacao no fim de cada incremento. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de rollout:
  - Fase 1 (staging): habilitar validacao de bootstrap e ajustar variaveis faltantes.
  - Fase 2 (pre-producao): executar checklist de segredos com dupla revisao.
  - Fase 3 (producao): liberar com monitoramento de erros de inicializacao.
- Plano de fallback: restaurar validacao anterior apenas em staging enquanto corrige matriz de variaveis.
- Plano de rollback: reverter commit de validacao/env baseline se houver indisponibilidade critica apos deploy.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-21 | Centralizar inventario de variaveis antes de alterar validacao de bootstrap | Evitar lacunas e falsos positivos em producao | Menor risco de outage por configuracao incompleta |
| 2026-04-21 | Proibir fallback hardcoded de segredo em `NODE_ENV=production` | Eliminar brecha de seguranca conhecida | Aumenta confianca do baseline de autenticacao |
| 2026-04-21 | Tratar YouTube API key como segredo sensivel condicional (obrigatoria apenas quando recurso estiver habilitado/acionado) | Evitar bloqueio indevido de bootstrap e manter seguranca da integracao | Melhor disponibilidade inicial sem perder guardrails |

## 9) Progresso e rastreabilidade (2026-04-22)

| Tarefa | Status | Evidencia atual |
| --- | --- | --- |
| T-01 | Concluida | Inventario consolidado em `docs/setup/production-env-secrets.md` e baseline de variaveis em `.env.example`. |
| T-02 | Concluida | Classificacao `required/optional/conditional/sensitive/public` registrada em `.env.example` e runbook. |
| T-03 | Concluida | `.env.example` atualizado com cobertura das variaveis usadas em runtime. |
| T-04 | Concluida | Validacao central implementada em `src/lib/env/productionBaseline.mjs` e acoplada ao bootstrap em `next.config.mjs`, preservando bootstrap sem bloqueio por `YOUTUBE_API_KEY` quando recurso nao e usado no startup. |
| T-05 | Concluida | Politica de segredos sem fallback inseguro validada por testes unitarios e cenarios de guarda de recurso condicional em `NODE_ENV=production`. |
| T-06 | Concluida | Runbook criado: `docs/setup/production-env-secrets.md`. |
| T-07 | Concluida | Executados com sucesso: `npm run lint`, `npm run build` (com env de producao valido), `npm run test:auth`, `npm run test:smoke`. |

| AC | Tarefas | Situacao atual |
| --- | --- | --- |
| AC-01 | T-01, T-02 | Concluido |
| AC-02 | T-02, T-03 | Concluido |
| AC-03 | T-04 | Concluido |
| AC-04 | T-05 | Concluido |
| AC-05 | T-06 | Concluido |
| AC-06 | T-07 | Concluido |
