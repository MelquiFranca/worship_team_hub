# Spec Funcional - transacoes-mongodb-fluxos-multicolecao

## 1) Contexto

- Data: 2026-04-24
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Backend, Produto, SRE, QA

## 2) Problema

Fluxos que escrevem em multiplas colecoes (ex.: grupos, configuracoes e gestor) usam compensacao manual, o que pode deixar dados inconsistentes em falhas parciais e aumenta a complexidade de manutencao.

## 3) Objetivo

Avaliar e implementar estrategia de transacoes MongoDB para fluxos multi-colecao criticos, garantindo atomicidade quando aplicavel e reduzindo risco de estado parcial.

## 4) Escopo

- Mapear fluxos multi-colecao com maior risco de inconsistencia.
- Definir criterios para uso de transacao vs abordagem atual de compensacao.
- Implementar transacoes nos fluxos prioritarios de escrita critica.
- Padronizar tratamento de erro/retry para falhas transacionais.
- Registrar telemetria e resultados operacionais do novo fluxo.

## 5) Nao-Escopo

- Reescrever todos os endpoints para transacoes indiscriminadamente.
- Alterar modelo de dados completo do dominio.
- Implementar saga distribuidade entre servicos externos.

## 6) Usuarios e Cenarios

- Usuario-alvo: administradores e gestores executando operacoes de cadastro/edicao.
- Cenarios principais:
  - Criacao de grupo + settings + gestor conclui de forma atomica.
  - Falha intermediaria aborta tudo sem estado parcial.
  - Operacoes concorrentes nao causam inconsistencias silenciosas.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Existe matriz de decisao definindo quais fluxos multi-colecao usam transacao. | Revisao de documento tecnico + aprovacao de arquitetura. | Alta |
| AC-02 | Fluxo prioritario de criacao de grupo/gestor/config executa em transacao atomica. | Teste de integracao com inducao de falha no meio do fluxo. | Alta |
| AC-03 | Em falha transacional, nenhum documento parcial permanece persistido. | Teste de integracao com verificacao de colecoes. | Alta |
| AC-04 | Tratamento de erro retorna resposta consistente e loga contexto sem dado sensivel. | Teste de contrato + revisao de logs. | Media |
| AC-05 | Existe diretriz de fallback quando transacao nao for suportada no ambiente (ou configuracao inadequada). | Teste manual + documentacao operacional. | Media |

## 8) Requisitos Nao Funcionais

- Performance: overhead transacional controlado (sem degradacao critica em operacoes administrativas).
- Confiabilidade: consistencia de dados priorizada em fluxos criticos.
- Observabilidade: logs estruturados para `transaction_start`, `transaction_commit`, `transaction_abort`.
- Seguranca: nao expor payload sensivel em mensagens de erro/log.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Falha em escrita da segunda colecao dentro da transacao | Abort da transacao e retorno de erro padronizado sem persistencia parcial. |
| ER-02 | Conflito transacional/transient error | Retry controlado conforme politica definida ou falha explicita com rastreabilidade. |
| ER-03 | Ambiente sem suporte/config para transacao | Aplicacao sinaliza claramente e segue politica de fallback documentada. |
| ER-04 | Timeout de transacao | Abort com log de contexto e resposta operacional consistente. |

## 10) Dependencias e Restricoes

- Dependencias: replica set MongoDB (requisito para transacoes), driver MongoDB, camada de repositorio/service.
- Restricoes: limites de tempo e lock de transacao sob carga.

## 11) Suposicoes

- Ambientes alvo suportarao transacoes MongoDB para fluxos priorizados.
- Times de produto e backend aceitam trade-off de pequena latencia extra em troca de consistencia.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02, AC-03 | T-02, T-03, T-04 |
| AC-04 | T-05 |
| AC-05 | T-06 |

## 13) Matriz de decisao transacional (AC-01)

| Fluxo | Colecoes envolvidas | Risco de estado parcial | Decisao | Justificativa |
| --- | --- | --- | --- | --- |
| Criacao admin de grupo | `groups`, `group_settings`, `components` (gestor) | Alto | Transacao MongoDB com retry | Fluxo critico multi-colecao com escrita encadeada e impacto funcional imediato. |
| Edicao admin de grupo | `groups`, `group_settings`, `components` (gestor) | Medio | Fora desta entrega | Manter escopo na criacao, que era o fluxo prioritario definido no plano. |
| Revogacao/limpeza compensatoria | `groups`, `group_settings`, `components` | Medio | Fallback por compensacao manual | Necessario para contingencia em ambiente sem suporte transacional. |
