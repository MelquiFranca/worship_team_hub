# Plano Tecnico - integracao-grupos-admin-banco

## 1) Referencia da Spec

- Feature: integracao-grupos-admin-banco
- Documento: `features/integracao-grupos-admin-banco/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Substituir a fonte de dados mock por leitura real do MongoDB diretamente na pagina server-side, com normalizacao de contrato, tratamento de fallback de imagem e estados de erro/vazio para manter resiliencia de UX.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Remover importacao de `src/data/groups.js` e implementar consulta a `groups` em `src/app/admin/grupos/page.js`. | AC-01, AC-02 | Revisao tecnica + manual | Diff da pagina e busca sem referencias a mock |
| T-02 | Resolver foto por `group_settings` com fallback para `groups.photoUrl` usando `serializeComponentPhoto`. | AC-03 | Manual + revisao tecnica | Diff da normalizacao de imagem |
| T-03 | Implementar fallback visual por iniciais e estado vazio quando a lista estiver sem itens. | AC-04, AC-06 | Manual | Diff de renderizacao + CSS |
| T-04 | Implementar tratamento de erro de leitura do banco com mensagem amigavel sem quebrar a pagina. | AC-05 | Manual (simulacao de falha) | Diff de tratamento de erro |
| T-05 | Remover arquivo de dados mock obsoleto (`src/data/groups.js`) e atualizar documentacao da feature. | AC-01 | Revisao tecnica | Arquivo removido + docs atualizadas |

## 4) Ordem de Execucao

1. Trocar origem de dados para MongoDB e remover dependencia de mock (T-01).
2. Integrar derivacao/fallback de imagem do grupo (T-02).
3. Cobrir estados de interface para vazio e sem foto (T-03).
4. Cobrir estado de indisponibilidade de banco (T-04).
5. Limpar mock legado e consolidar documentacao (T-05).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Divergencia de formato entre `groups._id` e `group_settings.groupId` | Medio | Media | Converter `_id` para `String` e aplicar fallback para `groups.photoUrl`. |
| Falha de Mongo interromper renderizacao da pagina | Alto | Media | Capturar excecao e retornar estado de erro amigavel. |
| Regressao visual por ausencia de imagem | Medio | Media | Fallback por iniciais e classe CSS dedicada para placeholder. |

## 6) Estrategia de Rollout

- Feature flag: Nao.
- Migracao necessaria: Nao.
- Plano de fallback: em erro de banco, manter pagina funcional com callout de indisponibilidade.
- Plano de rollback: restaurar versao anterior da pagina e reintroduzir mock temporariamente apenas em incidente critico.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressao funcional aparente no diff

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-19 | Leitura direta do MongoDB na pagina server-side | Eliminar mock no caminho principal com menor superficie de mudanca | Reduz complexidade e dependencia de camada extra |
| 2026-04-19 | Priorizar foto de `group_settings` e fallback para `groups.photoUrl` | Reutilizar origem mais atual da identidade visual do grupo | Melhora consistencia visual com configuracoes do grupo |
| 2026-04-19 | Fallback por iniciais para grupos sem imagem | Evitar quebra visual e garantir identificacao minima do card | UX consistente mesmo sem ativo de imagem |
