# Spec Funcional - backend-cadastro-componentes-escalas

## 1) Contexto

- Data: 2026-04-15
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Frontend, Backend, Seguranca, DevOps

## 2) Problema

As telas de `cadastro-componentes` e `cadastro-escalas` existem, mas hoje operam com estado local/mock para persistencia. Isso impede consistencia de dados entre sessoes, dificulta auditoria e nao garante controles de seguranca para credenciais e acesso a dados.

## 3) Objetivo

Implementar backend real para cadastro de componentes e escalas com MongoDB, incluindo rotas de API protegidas, camada segura de conexao com banco e consumo dessas APIs no frontend para substituir o fluxo mock/local.

## 4) Escopo

- Backend de componentes:
  - Criar rota API para cadastro de componentes.
  - Criar rota API para listar componentes (suporte ao formulario de escalas e listagens).
- Backend de escalas:
  - Criar rota API para cadastro de escalas.
  - Criar rota API para listar escalas (suporte ao fluxo de telas e validacao).
- Banco MongoDB:
  - Implementar camada de conexao reutilizavel com pooling/cache de cliente.
  - Centralizar configuracao por variaveis de ambiente sem hardcode de credenciais.
  - Definir validacoes basicas e indices minimos.
- Frontend:
  - Integrar `ComponentRegistrationForm` com rota de cadastro de componentes.
  - Integrar `ScaleRegistrationForm` com rotas de leitura de componentes e cadastro de escalas.
  - Tratar loading, sucesso e erro com feedback ao usuario.

## 5) Nao-Escopo

- Migracao completa de todos os dados mock legados para MongoDB.
- Upload real de imagem em storage externo (S3/Cloudinary); neste ciclo pode ser metadata/base64 temporario conforme limite definido.
- Edicao e exclusao completas de componentes e escalas (CRUD total).
- Processos assicronos avancados (fila/event bus).

## 6) Usuarios e Cenarios

- Usuario-alvo:
  - `admin-panel`
  - `group-app`
- Cenarios principais:
  - Lider de grupo cadastra um componente e recebe confirmacao de persistencia real.
  - Lider de grupo abre cadastro de escala e carrega componentes pela API.
  - Lider de grupo salva escala com data, turno, componentes/funcoes e playlist.
  - Requisicao invalida retorna erro consistente sem vazar detalhes internos.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Existe estrutura de conexao MongoDB centralizada (`lib/db`) usando apenas variaveis de ambiente para credenciais e nome do banco. | Revisao de codigo + teste de inicializacao em ambiente local. | Alta |
| AC-02 | Credenciais sensiveis nao sao expostas em logs, payloads de erro ou codigo cliente. | Revisao de seguranca + teste manual de erro de conexao. | Alta |
| AC-03 | `POST /api/components` valida payload obrigatorio e persiste componente no MongoDB. | Teste de integracao de rota com payload valido/invalido. | Alta |
| AC-04 | `GET /api/components` retorna lista paginada/limitada de componentes do contexto de grupo. | Teste de integracao de rota e contrato de resposta. | Media |
| AC-05 | `POST /api/scales` valida dados obrigatorios (data, turno, componentes com funcao) e persiste escala no MongoDB. | Teste de integracao de rota com payload valido/invalido. | Alta |
| AC-06 | `GET /api/scales` retorna escalas cadastradas com dados necessarios para renderizacao no frontend. | Teste de integracao de rota e contrato de resposta. | Media |
| AC-07 | `ComponentRegistrationForm` envia cadastro para API real, exibe loading/sucesso/erro e limpa estado somente no sucesso. | Teste de integracao frontend (mock fetch) + validacao manual. | Alta |
| AC-08 | `ScaleRegistrationForm` consome componentes da API e envia cadastro de escala para API real, com feedback de status. | Teste de integracao frontend + validacao manual ponta a ponta. | Alta |
| AC-09 | Rotas de cadastro/listagem de componentes e escalas exigem sessao valida e audiencia autorizada (`admin-panel` ou `group-app`). | Teste de integracao com tokens validos/invalidos e perfis nao autorizados. | Alta |
| AC-10 | Falhas de validacao retornam `400`, falta de autenticacao `401`, acesso negado `403`, erro interno `500` com resposta padronizada. | Teste de integracao da matriz de erros. | Alta |

## 8) Requisitos Nao Funcionais

- Performance:
  - p95 de criacao (`POST`) <= 500ms em ambiente local sem carga.
  - p95 de listagem (`GET`) <= 300ms para paginas iniciais.
- Seguranca:
  - Uso de `.env`/secret manager para `MONGODB_URI` e `MONGODB_DB_NAME`.
  - Proibido fallback inseguro com credencial hardcoded em producao.
  - Validacao server-side de `aud` e `groupId` antes de persistir/consultar.
- Acessibilidade:
  - Feedback de submit com `role="status"`/`role="alert"` nas telas.
- Observabilidade:
  - Log estruturado minimo de `requestId`, rota, status e latencia.
  - Sem log de senha/token/credenciais.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | `MONGODB_URI` ausente | API retorna `500` padronizado; log interno indica configuracao ausente sem expor segredo. |
| ER-02 | Payload de componente incompleto | API retorna `400` com detalhes de campos invalidos. |
| ER-03 | Usuario sem permissao (`component-app`) tenta cadastrar componente/escala | API retorna `403`; frontend exibe mensagem de acao nao permitida. |
| ER-04 | Escala sem componentes ou sem funcao por componente | API retorna `400` e frontend destaca pendencias. |
| ER-05 | Falha de conexao com MongoDB | API retorna `500`; frontend exibe erro amigavel e permite nova tentativa. |
| ER-06 | Duplicidade de usuario de componente no mesmo grupo | API retorna `409` com mensagem clara para ajuste. |

## 10) Dependencias e Restricoes

- Dependencias:
  - Stack atual Next.js App Router (`src/app/api/...`).
  - Sessao JWT ja implementada (`/api/auth/*`, middleware e contexto de sessao).
  - MongoDB disponivel por ambiente (local/dev/hml/prod).
- Restricoes:
  - Manter compatibilidade com contratos atuais de UI.
  - Evitar quebra de fluxos existentes de YouTube/playlist na tela de escalas.

## 11) Suposicoes

- Claims de sessao incluem `aud` e `groupId` confiaveis para segregacao de dados.
- As colecoes alvo no MongoDB serao `components` e `scales` (podendo reutilizar convencoes de docs/database ja criadas).
- O upload de foto de componente neste ciclo sera simplificado para metadado/URL temporaria.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01, AC-02 | T-01, T-02 |
| AC-03, AC-04 | T-03, T-04 |
| AC-05, AC-06 | T-05, T-06 |
| AC-07 | T-07 |
| AC-08 | T-08 |
| AC-09, AC-10 | T-02, T-09, T-10 |

