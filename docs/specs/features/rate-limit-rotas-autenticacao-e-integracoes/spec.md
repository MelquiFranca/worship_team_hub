# Spec Funcional - rate-limit-rotas-autenticacao-e-integracoes

## 1) Contexto

- Data: 2026-04-21
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Backend, Seguranca, SRE

## 2) Problema

Rotas sensiveis de autenticacao e integracao externa ainda nao aplicam limitacao de taxa por cliente. Isso permite tentativas massivas de brute-force no login/refresh e abuso de consumo nas rotas de YouTube, com risco de indisponibilidade, custo e bloqueio por cota externa.

## 3) Objetivo

Implementar rate limit consistente e observavel para rotas de autenticacao e integracoes externas, reduzindo superficie de ataque e protegendo a capacidade da aplicacao sem impactar fluxo legitimo.

## 4) Escopo

- Implementar limitacao de taxa para `POST /api/auth/login`.
- Implementar limitacao de taxa para `POST /api/auth/refresh`.
- Implementar limitacao de taxa para `GET /api/youtube/search`.
- Implementar limitacao de taxa para `GET /api/youtube/preview`.
- Padronizar resposta `429 Too Many Requests` com codigo de erro estavel e `Retry-After`.
- Instrumentar logs estruturados e metricas basicas de rate limit por rota.
- Definir estrategia de chave de limitacao por tipo de rota (IP, sessao e/ou identificador). 

## 5) Nao-Escopo

- CAPTCHA, desafio progressivo ou MFA.
- WAF externo/CDN rate-limiting gerenciado por infraestrutura.
- Bloqueio permanente de IP (banlist persistente).
- Alteracao de regras de autorizacao JWT.

## 6) Usuarios e Cenarios

- Usuario-alvo: usuarios finais autenticando, clientes consumindo integracao de busca/preview, time de operacao.
- Cenarios principais:
  - Atacante tenta brute-force em login e recebe bloqueio temporario com `429`.
  - Cliente legitimo faz uso normal das rotas sem perceber degradacao.
  - Pico de chamadas em YouTube search/preview e contido sem derrubar API.
  - Time de suporte consegue rastrear eventos de limitacao por logs/metricas.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | `POST /api/auth/login` aplica janela de rate limit por IP+identificador (email/username normalizado), com bloqueio apos exceder limite configurado. | Teste de integracao com N requisicoes sequenciais acima do limite. | Alta |
| AC-02 | `POST /api/auth/refresh` aplica limite por IP e token/session fingerprint para reduzir abuso de renovacao. | Teste de integracao com burst no endpoint de refresh. | Alta |
| AC-03 | `GET /api/youtube/search` e `GET /api/youtube/preview` aplicam limite por IP/sessao, protegendo quota externa. | Testes de integracao por rota com repeticao de requests. | Alta |
| AC-04 | Quando limite e excedido, a API retorna `429` com payload padrao (`error.code`, `message`) e header `Retry-After` em segundos. | Teste de contrato HTTP + assercao de headers e payload. | Alta |
| AC-05 | Limites sao configuraveis por variavel de ambiente com defaults seguros para desenvolvimento e producao. | Teste unitario/config + validacao manual em ambiente local. | Media |
| AC-06 | Logs estruturados registram evento de bloqueio (`rate_limit_blocked`) sem dados sensiveis e com chave de correlacao minima (rota, metodo, hash da chave, requestId). | Teste unitario de logger + inspecao de logs locais. | Media |
| AC-07 | Metricas/counters por rota contabilizam requests aceitos e bloqueados por janela. | Teste de integracao + verificacao de exposicao em log/collector interno. | Media |
| AC-08 | Overhead do middleware/camada de rate limit nao aumenta latencia p95 em mais de 10ms no ambiente local de referencia para requests abaixo do limite. | Benchmark local controlado antes/depois. | Media |
| AC-09 | Em caso de falha da dependencia de armazenamento de rate limit, comportamento segue politica fail-safe definida (padrao: fail-closed em auth e fail-open controlado em integracao, com log de erro). | Teste de falha injetada no provider de armazenamento. | Alta |

## 8) Requisitos Nao Funcionais

- Performance: overhead p95 <= 10ms em requests nao bloqueadas para as rotas alvo.
- Seguranca:
  - Mitigar brute-force em login e abuso de refresh token.
  - Evitar vazamento de email/login/token em logs; usar hash/mascaramento de chave.
  - Resposta `429` sem revelar detalhes internos de politica.
- Confiabilidade:
  - Janela e contadores consistentes durante a vigencia da politica.
  - Politica explicita para indisponibilidade de store de rate limit.
- Observabilidade:
  - Evento `rate_limit_blocked` com rota, metodo, janela, limite, retryAfter.
  - Contadores de `rate_limit_allowed` e `rate_limit_blocked` por endpoint.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Chave de rate limit nao pode ser derivada do request | Aplicar fallback para IP e continuar avaliacao do limite. |
| ER-02 | Cliente excede limite de login | `429` com codigo `AUTH_RATE_LIMITED` e `Retry-After`. |
| ER-03 | Cliente excede limite de refresh | `429` com codigo `AUTH_REFRESH_RATE_LIMITED` e `Retry-After`. |
| ER-04 | Cliente excede limite em integracao YouTube | `429` com codigo `INTEGRATION_RATE_LIMITED` e `Retry-After`. |
| ER-05 | Store de rate limit indisponivel em rota de auth | Rejeitar request (`429`/`503` conforme politica), registrar erro observavel. |
| ER-06 | Store de rate limit indisponivel em rota de integracao | Permitir request com modo degradado controlado e log de alerta. |

## 10) Dependencias e Restricoes

- Dependencias:
  - Camada de API Next.js route handlers.
  - Provider de armazenamento de contador (in-memory inicialmente, evolutivo para Redis).
  - Infra de logs/metrica ja adotada no projeto.
- Restricoes:
  - Implementacao deve ser compativel com runtime Node atual das rotas de auth.
  - Solucao precisa funcionar em ambiente single-instance no MVP e ser evolutiva para multi-instance.

## 11) Suposicoes

- O MVP aceitara armazenamento in-memory inicial com contrato pronto para troca por Redis.
- O projeto possui mecanismo de leitura de env vars em build/runtime.
- `requestId` ou equivalente pode ser gerado quando ausente.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-03, T-05 |
| AC-02 | T-01, T-03, T-06 |
| AC-03 | T-01, T-04, T-07 |
| AC-04 | T-02, T-03, T-04 |
| AC-05 | T-01, T-09 |
| AC-06 | T-08 |
| AC-07 | T-08 |
| AC-08 | T-10 |
| AC-09 | T-01, T-11 |
