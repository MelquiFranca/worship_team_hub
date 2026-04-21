# Spec Funcional - persistencia-refresh-sessions-mongodb

## 1) Contexto

- Data: 2026-04-21
- Autor(a): Codex
- Status: Draft
- Stakeholders: Backend, Banco de Dados, Seguranca, Plataforma

## 2) Problema

As refresh sessions estao em memoria de processo. Em restart ocorre perda de sessao e em multiplas instancias nao ha consistencia de revogacao/rotacao, inviabilizando operacao de producao escalavel.

## 3) Objetivo

Persistir refresh sessions no MongoDB com suporte a rotacao, revogacao e validacao consistente entre instancias, mantendo seguranca e previsibilidade operacional.

## 4) Escopo

- Substituir store em memoria por repositorio MongoDB para refresh sessions.
- Persistir metadados minimos da sessao (usuario, jti, expiracao, status, timestamps).
- Garantir rotacao atomica de refresh token e invalidacao do anterior.
- Garantir revogacao em logout refletida para qualquer instancia da aplicacao.
- Definir indices necessarios (consulta por token/jti, expiracao/TTL conforme estrategia).

## 5) Nao-Escopo

- Migracao para outro banco que nao MongoDB.
- Gestao avancada de dispositivos com interface administrativa completa.
- Historico analitico de sessao de longo prazo.

## 6) Usuarios e Cenarios

- Usuario-alvo: usuarios autenticados e times de backend/operacao.
- Cenarios principais:
  - Login cria refresh session persistida em Mongo.
  - Refresh rotaciona token e invalida token anterior sem race condition.
  - Logout revoga sessao e impede novo refresh em qualquer replica/instancia.
  - Restart da aplicacao nao invalida sessoes validas persistidas.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Login com credenciais validas cria refresh session persistida no MongoDB. | Teste de integracao API + consulta na colecao. | Alta |
| AC-02 | Refresh token valido realiza rotacao atomica: novo token ativo e token anterior revogado/invalido. | Teste de integracao com tentativa de replay do token antigo. | Alta |
| AC-03 | Logout revoga sessao persistida e impede nova renovacao com o mesmo refresh token. | Teste de integracao pos-logout. | Alta |
| AC-04 | Sessoes persistidas sobrevivem a restart de processo e sao reconhecidas corretamente. | Teste manual/integracao simulando restart. | Alta |
| AC-05 | Indices obrigatorios da colecao estao definidos para consultas e expiracao sem degradacao relevante. | Verificacao de indices + teste de consulta basica. | Media |
| AC-06 | Nao ha dependencia funcional da store em memoria para fluxo de refresh em producao. | Teste de regressao e revisao de codigo. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: operacoes de login/refresh/logout devem manter latencia aceitavel (objetivo p95 <= 150ms local de referencia).
- Seguranca: refresh token armazenado de forma segura (hash quando aplicavel) e nunca logado em claro.
- Acessibilidade: nao aplicavel a UI nesta feature.
- Observabilidade: logs estruturados de `refresh_session_created`, `refresh_session_rotated`, `refresh_session_revoked`.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Falha de conexao com Mongo ao criar sessao | `503` ou erro padronizado de dependencia indisponivel; sem emitir sessao inconsistente. |
| ER-02 | Refresh token inexistente/revogado | `401 Unauthorized` com codigo de refresh invalido/revogado. |
| ER-03 | Tentativa de replay de refresh token antigo | `401 Unauthorized` e registro de evento de seguranca. |
| ER-04 | Corrida de refresh simultaneo | Apenas uma rotacao valida; demais tentativas devem falhar com contrato padronizado. |
| ER-05 | Indice ausente/degradado | Alerta operacional e acao corretiva documentada. |

## 10) Dependencias e Restricoes

- Dependencias: conexao MongoDB, colecao dedicada de refresh sessions, camada de repositorio de auth.
- Restricoes: manter contrato publico de endpoints de login/refresh/logout.

## 11) Suposicoes

- MongoDB esta disponivel com permissao de criar/usar indices necessarios.
- Fluxo atual de auth ja opera com conceito de refresh token e pode ser acoplado ao repositorio persistente.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-02, T-03 |
| AC-03 | T-03, T-04 |
| AC-04 | T-02, T-05 |
| AC-05 | T-01, T-06 |
| AC-06 | T-05, T-07 |
