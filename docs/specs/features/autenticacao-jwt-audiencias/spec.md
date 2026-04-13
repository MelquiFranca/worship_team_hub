# Spec Funcional - autenticacao-jwt-audiencias

## 1) Contexto

- Data: 2026-04-12
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Backend, Frontend, Segurança

## 2) Problema

Atualmente a aplicação usa autenticação mock em client-side (sessionStorage) sem validação criptográfica e sem segregação robusta de autorização por contexto de uso. Isso permite inconsistência entre perfil logado e rotas acessadas, além de não existir controle formal de audiência (`aud`) para separar tokens por canal (admin, app do grupo, app de componente).

## 3) Objetivo

Implementar autenticação e autorização com JWT no backend, com emissão e validação de tokens por audiência, garantindo que cada token só acesse rotas compatíveis com seu `aud` e permissões do perfil.

## 4) Escopo

- Implementar login real com emissão de `access token` JWT e `refresh token`.
- Definir matriz de audiências e papéis:
  - `aud=admin-panel` para perfis administrativos.
  - `aud=group-app` para perfil `group_owner`.
  - `aud=component-app` para perfil `component`.
- Implementar middleware de autenticação para validar assinatura, expiração, issuer e audiência.
- Implementar middleware/autorizador para controle de acesso por role + audiência por rota.
- Implementar endpoint de refresh token com rotação e revogação do token anterior.
- Implementar endpoint de logout para invalidação de sessão/token de refresh.
- Adaptar endpoints protegidos existentes para exigir autenticação.
- Implementar observabilidade mínima de eventos de auth (sucesso/falha/revogação).

## 5) Não-Escopo

- SSO/OAuth social.
- MFA/2FA.
- Gestão avançada de consentimento e dispositivos confiáveis.
- Federation entre múltiplos provedores de identidade externos.

## 6) Usuários e Cenários

- Usuário-alvo: administrador, líder de grupo (`group_owner`) e componente (`component`).
- Cenários principais:
  - Admin autentica no painel administrativo e acessa apenas rotas de admin.
  - Líder de grupo autentica no app do grupo e gerencia escalas/configurações do próprio grupo.
  - Componente autentica e acessa apenas recursos permitidos para componente.
  - Token de audiência incorreta tenta acessar rota protegida e recebe bloqueio.
  - Access token expira, cliente usa refresh token válido e obtém novo par de tokens.

## 7) Critérios de Aceite (testáveis)

Use formato passa/falha.

| ID | Critério | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Login válido gera JWT assinado com claims mínimas (`sub`, `aud`, `role`, `groupId` quando aplicável, `iat`, `exp`, `iss`, `jti`). | Teste de integração do endpoint de login + inspeção do payload JWT. | Alta |
| AC-02 | Login inválido (credenciais incorretas, usuário inativo) retorna erro padronizado sem expor motivo sensível. | Teste de integração + teste de segurança de mensagem de erro. | Alta |
| AC-03 | Rotas administrativas aceitam apenas token com `aud=admin-panel` e role compatível. | Teste de integração com matriz de cenários (token válido/inválido). | Alta |
| AC-04 | Rotas do app de grupo aceitam apenas token com `aud=group-app` e role `group_owner`; acesso a dados de outro grupo é bloqueado. | Teste de integração com casos de autorização por `groupId`. | Alta |
| AC-05 | Rotas de componente aceitam apenas token com `aud=component-app` e role `component`; acesso fora do próprio escopo é negado. | Teste de integração de autorização por owner/resource. | Alta |
| AC-06 | Endpoint de refresh valida refresh token, rotaciona token, invalida o anterior e retorna novo par de tokens. | Teste de integração + teste de replay (refresh antigo deve falhar). | Alta |
| AC-07 | Logout invalida refresh token ativo e impede nova renovação com o mesmo token. | Teste de integração pós-logout. | Alta |
| AC-08 | Middleware retorna códigos HTTP e mensagens consistentes (`401` para não autenticado, `403` para não autorizado). | Teste automatizado de contrato de erro. | Média |
| AC-09 | Eventos de autenticação relevantes são logados com dados mínimos (sem senha/token em claro). | Teste unitário/integrado de logger + revisão de logs. | Média |
| AC-10 | Frontend atual deixa de depender de `sessionStorage` mock para proteção de rotas sensíveis e passa a usar sessão JWT. | Teste manual + integração em fluxo login->acesso->logout. | Alta |

## 8) Requisitos Não Funcionais

- Performance: validação de token em middleware com sobrecarga baixa (p95 <= 30ms local para validação isolada).
- Segurança:
  - Segredos em variáveis de ambiente.
  - Algoritmo forte (ex.: HS256 com segredo robusto ou preferencialmente RS256 com chave privada/publica).
  - `access token` de curta duração (ex.: 15 min).
  - `refresh token` com duração maior e rotação obrigatória.
  - Hash seguro de senha (bcrypt/argon2).
  - Nunca registrar senha ou token bruto em logs.
- Acessibilidade: mensagens de erro de autenticação exibidas de forma legível e navegável por teclado.
- Observabilidade:
  - logs estruturados para `login_success`, `login_fail`, `token_refresh`, `token_revoked`, `access_denied`.
  - correlação por `requestId`/`jti` quando possível.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condição | Resposta esperada |
| --- | --- | --- |
| ER-01 | JWT ausente em rota protegida | `401 Unauthorized` com código de erro padronizado `AUTH_TOKEN_MISSING`. |
| ER-02 | JWT malformado/assinatura inválida | `401 Unauthorized` com `AUTH_TOKEN_INVALID`. |
| ER-03 | JWT expirado | `401 Unauthorized` com `AUTH_TOKEN_EXPIRED`; cliente pode usar refresh. |
| ER-04 | Audiência incompatível com a rota | `403 Forbidden` com `AUTH_AUDIENCE_FORBIDDEN`. |
| ER-05 | Role incompatível | `403 Forbidden` com `AUTH_ROLE_FORBIDDEN`. |
| ER-06 | Acesso cross-group (groupId divergente) | `403 Forbidden` com `AUTH_SCOPE_FORBIDDEN`. |
| ER-07 | Reuso de refresh token já rotacionado/revogado | `401 Unauthorized` com `AUTH_REFRESH_REVOKED`. |
| ER-08 | Tentativas excessivas de login | `429 Too Many Requests` com política de rate-limit definida. |

## 10) Dependências e Restrições

- Dependências:
  - Persistência de usuários e refresh tokens no MongoDB.
  - Camada de crypto/JWT (ex.: `jose` ou `jsonwebtoken`).
  - Middleware no Next.js (App Router) para proteção de rotas/API.
- Restrições:
  - Compatibilidade com estrutura de perfis já existente (`admin`, `group_owner`, `component`).
  - Mudança incremental para não interromper fluxos já entregues.

## 11) Suposições

- O projeto passará a usar backend como fonte de verdade de sessão (não apenas estado em client).
- Há disponibilidade de coleções para armazenar usuários e sessões/refresh tokens.
- O canal administrativo e o canal de grupo/componente podem compartilhar o mesmo backend, diferenciando-se por `aud`.

## 12) Rastreabilidade inicial

Mapeie cada critério de aceite para tarefas no plano técnico.

| Critério | Tarefa(s) do plano |
| --- | --- |
| AC-01, AC-02 | T-01, T-02, T-03 |
| AC-03, AC-04, AC-05 | T-04, T-05, T-06 |
| AC-06, AC-07 | T-07, T-08 |
| AC-08 | T-04, T-06, T-09 |
| AC-09 | T-10 |
| AC-10 | T-11, T-12 |
