# Plano Técnico - autenticacao-jwt-audiencias

## 1) Referência da Spec

- Feature: autenticacao-jwt-audiencias
- Documento: `features/autenticacao-jwt-audiencias/spec.md`
- Versão da spec: v1

## 2) Estratégia de Implementação

Implementar em camadas, começando por domínio de autenticação (token service + contratos), depois proteger rotas por middleware e autorização por audiência/role, e por fim integrar frontend e observabilidade. O rollout será incremental com fallback temporário para fluxos mock apenas em ambiente de desenvolvimento até validação completa.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidência |
| --- | --- | --- | --- | --- |
| T-01 | Definir contratos de auth (claims JWT, matriz de `aud`, códigos de erro, TTLs) em módulo central | AC-01, AC-08 | Unitário | Arquivo de contrato + testes |
| T-02 | Implementar serviço JWT (sign/verify) com validação de `iss`, `aud`, `exp`, `jti` | AC-01, AC-03, AC-04, AC-05 | Unitário | Testes de token service |
| T-03 | Implementar endpoint de login com validação de credencial e emissão de access/refresh token | AC-01, AC-02 | Integração | Testes de API login |
| T-04 | Implementar middleware de autenticação para rotas protegidas (API e páginas server-side relevantes) | AC-03, AC-04, AC-05, AC-08 | Integração | Testes middleware + matriz de rota |
| T-05 | Implementar autorização por audiência e role (policies por domínio de rota) | AC-03, AC-04, AC-05 | Integração | Testes de policy authorization |
| T-06 | Implementar autorização de escopo (`groupId`/owner) para evitar cross-tenant/cross-group | AC-04, AC-05, AC-08 | Integração | Testes de escopo |
| T-07 | Implementar endpoint de refresh token com rotação (token family) e replay protection | AC-06 | Integração + Segurança | Testes de rotação/replay |
| T-08 | Implementar endpoint de logout e revogação de refresh token/sessão | AC-07 | Integração | Teste pós-logout |
| T-09 | Padronizar resposta de erro auth (`401`/`403`) com códigos e mensagens estáveis | AC-08 | Unitário + Integração | Snapshot/contract tests |
| T-10 | Instrumentar logs estruturados de auth sem dados sensíveis | AC-09 | Unitário + Manual | Saída de logs validada |
| T-11 | Integrar frontend de login/admin para consumir sessão JWT e remover dependência de mock para rotas críticas | AC-10 | Integração + Manual | Fluxo login->rota protegida |
| T-12 | Atualizar testes end-to-end dos fluxos principais (admin, group_owner, component) e consolidar `validation.md` | AC-01 a AC-10 | E2E + Manual | Relatório final de validação |

## 4) Ordem de Execução

1. Contratos e fundamentos de segurança (T-01, T-02).
2. Login e emissão de tokens (T-03).
3. Proteção e autorização de rotas (T-04, T-05, T-06).
4. Ciclo de vida da sessão (refresh/logout) (T-07, T-08).
5. Consistência de erro e observabilidade (T-09, T-10).
6. Integração frontend + validação final (T-11, T-12).

## 5) Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
| --- | --- | --- | --- |
| Configuração incorreta de audiência permitindo acesso indevido | Alto | Média | Política centralizada por rota + testes de matriz `aud x role x rota`. |
| Vazamento de segredo JWT | Alto | Baixa | Segredos em env manager, rotação de chaves e sem commit em repositório. |
| Regressão em fluxos existentes por troca do mock para auth real | Alto | Média | Rollout em fases com fallback em dev e checklist de regressão por fluxo. |
| Reuso de refresh token (replay) | Alto | Média | Rotação obrigatória + blacklist/token family + auditoria de eventos. |
| Falha de performance em middleware de validação | Médio | Baixa | Benchmark local e caching estratégico de chave pública (se RS256). |

## 6) Estratégia de Rollout

- Feature flag: Sim (ex.: `AUTH_JWT_ENABLED`)
- Migração necessária: Sim (coleção de refresh sessions/tokens e eventuais campos auxiliares em usuários)
- Plano de fallback: desabilitar flag para retornar temporariamente ao fluxo mock em desenvolvimento/homologação.
- Plano de rollback: reverter endpoints/middleware de auth e restaurar versão anterior estável do fluxo de login.

## 7) Critérios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidências registradas
- [ ] Sem regressões críticas

## 8) Registro de Decisões Técnicas

| Data | Decisão | Motivação | Impacto |
| --- | --- | --- | --- |
| 2026-04-12 | Segregar acesso por claim `aud` além de `role` | Evitar uso de token válido em canal indevido | Aumenta segurança por contexto de aplicação |
| 2026-04-12 | Adotar refresh token rotativo com revogação | Reduz risco de sessão comprometida e replay | Maior complexidade de persistência e controle de sessão |
| 2026-04-12 | Centralizar políticas de autorização em camada única | Evitar lógica duplicada e divergente nas rotas | Facilita manutenção e auditoria |
