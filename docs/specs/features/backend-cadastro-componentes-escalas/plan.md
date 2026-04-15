# Plano Tecnico - backend-cadastro-componentes-escalas

## 1) Referencia da Spec

- Feature: backend-cadastro-componentes-escalas
- Documento: `features/backend-cadastro-componentes-escalas/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Executar em tres camadas:

1. Infra de dados segura (conexao MongoDB + repositorios + validacao base).
2. API backend para componentes e escalas com autorizacao por audiencia.
3. Integracao frontend substituindo mock/local por chamadas HTTP reais.

Manter contratos de resposta consistentes para reduzir retrabalho no frontend e permitir testes de integracao previsiveis.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Criar modulo `src/lib/db/mongodb.(js|ts)` com `MongoClient` singleton/cache, leitura de `MONGODB_URI` e `MONGODB_DB_NAME` via `process.env`. | AC-01 | Unitario + Integracao | Teste de bootstrap do cliente |
| T-02 | Padronizar utilitarios de erro/log para evitar vazamento de segredo e garantir matriz `400/401/403/500`. | AC-02, AC-09, AC-10 | Unitario + Integracao | Testes de resposta de erro |
| T-03 | Implementar `POST /api/components` com validacao de payload, hash de senha (quando aplicavel), persistencia e retorno sanitizado. | AC-03, AC-10 | Integracao | Testes de rota componentes POST |
| T-04 | Implementar `GET /api/components` com filtro por `groupId`, limite/paginacao basica e ordenacao estavel. | AC-04, AC-09 | Integracao | Testes de rota componentes GET |
| T-05 | Implementar `POST /api/scales` com validacao de regras (data, turno, componentes/funcoes, playlist opcional) e persistencia. | AC-05, AC-10 | Integracao | Testes de rota escalas POST |
| T-06 | Implementar `GET /api/scales` com retorno de escalas por `groupId` e campos necessarios para consumo de tela. | AC-06, AC-09 | Integracao | Testes de rota escalas GET |
| T-07 | Integrar `ComponentRegistrationForm` para usar `POST /api/components` com estados `loading/success/error` e reset controlado. | AC-07 | Integracao frontend + Manual | Captura de tela + testes |
| T-08 | Integrar `ScaleRegistrationForm` para carregar componentes via `GET /api/components` e salvar via `POST /api/scales`. | AC-08 | Integracao frontend + Manual | Captura de tela + testes |
| T-09 | Aplicar guardas de audiencia/role nas rotas novas (`admin-panel`, `group-app`) e bloquear `component-app`. | AC-09, AC-10 | Integracao | Testes com matriz de perfis |
| T-10 | Criar bateria final de validacao (contratos + smoke manual) e preencher `validation.md` e `evidence.md`. | AC-01..AC-10 | Manual + Integracao | Arquivos de validacao atualizados |

## 4) Ordem de Execucao

1. Infra segura e padronizacao de erro (T-01, T-02).
2. APIs de componentes (T-03, T-04).
3. APIs de escalas (T-05, T-06).
4. Integracao frontend de componentes e escalas (T-07, T-08).
5. Endurecimento de autorizacao e fechamento de validacao (T-09, T-10).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Quebra de fluxo atual por troca de mock para API real | Alto | Media | Feature flag por pagina e fallback temporario para mock durante rollout. |
| Vazamento acidental de credenciais em logs/erros | Alto | Baixa | Sanitizacao centralizada + revisao de seguranca antes de merge. |
| Divergencia de contrato entre backend e frontend | Medio | Media | Definir payload/resposta em contratos compartilhados e validar por testes de integracao. |
| Latencia alta por ausencia de indices no MongoDB | Medio | Media | Criar indices minimos (`groupId`, `createdAt`, `username`) e monitorar p95. |
| Regras de permissao inconsistentes entre middleware e APIs | Alto | Media | Reuso de utilitario unico de autorizacao e testes de matriz de perfis. |

## 6) Estrategia de Rollout

- Feature flag: Sim (`BACKEND_CADASTROS_V1` por tela/fluxo).
- Migracao necessaria: Nao obrigatoria para deploy inicial; apenas criacao de colecoes/indices.
- Plano de fallback: desativar flag e retornar submits locais/mock em caso de instabilidade.
- Plano de rollback: reverter rotas novas e manter frontend no fluxo antigo ate correcao.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressoes criticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-15 | Adotar `MongoClient` singleton em `lib/db` | Evitar reconexoes excessivas e reduzir latencia | Melhor desempenho e estabilidade |
| 2026-04-15 | Proteger credenciais exclusivamente por variavel de ambiente | Atender padroes de seguranca e compliance | Reduz risco de exposicao de segredo |
| 2026-04-15 | Padronizar respostas de erro por status HTTP | Melhor DX/UX e testes previsiveis | Menor acoplamento entre camadas |

