# Spec Funcional - hardening-segredo-jwt-obrigatorio

## 1) Contexto

- Data: 2026-04-21
- Autor(a): Codex
- Status: Draft
- Stakeholders: Backend, Seguranca, Plataforma

## 2) Problema

Existe fallback hardcoded para segredo JWT. Quando variaveis de ambiente nao estao definidas, a aplicacao ainda emite e valida tokens com segredo conhecido, elevando risco de comprometimento de sessao.

## 3) Objetivo

Tornar obrigatoria a configuracao de segredo/chaves JWT em tempo de inicializacao e em execucao, bloqueando qualquer emissao/validacao de token com fallback inseguro.

## 4) Escopo

- Remover fallback hardcoded de segredo JWT em servicos de autenticacao.
- Validar configuracao obrigatoria de segredo/chave no boot da aplicacao.
- Padronizar resposta de erro de misconfiguracao para ambientes sem segredo/chaves.
- Atualizar exemplos de variaveis de ambiente relacionadas a JWT.

## 5) Nao-Escopo

- Troca de algoritmo criptografico (ex.: HS256 para RS256).
- Implementacao de KMS externo para rotacao automatica.
- Alteracoes de UX de login alem de mensagens tecnicas de indisponibilidade.

## 6) Usuarios e Cenarios

- Usuario-alvo: time de backend e operacao da plataforma.
- Cenarios principais:
  - Ambiente sobe com segredo JWT configurado e autenticacao funciona normalmente.
  - Ambiente sobe sem segredo JWT e a aplicacao falha de forma explicita e rastreavel.
  - Requisicao de auth em ambiente misconfigurado retorna erro padronizado sem fallback.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Nao existe fallback hardcoded para segredo JWT no codigo de emissao e validacao. | Teste unitario + busca esttica por fallback proibido. | Alta |
| AC-02 | Ao iniciar sem `JWT_SECRET`/`AUTH_JWT_SECRET` (ou par de chaves equivalente), a aplicacao falha com erro explicito de configuracao. | Teste de integracao de bootstrap sem envs. | Alta |
| AC-03 | Endpoints de autenticacao em ambiente misconfigurado retornam erro padronizado (`503` + codigo de erro de config). | Teste de integracao em API de login/refresh. | Alta |
| AC-04 | `.env.example` documenta todas as variaveis JWT obrigatorias para producao. | Revisao de arquivo + checklist tecnico. | Media |
| AC-05 | Logs tecnicos registram misconfiguracao sem expor segredo/chaves. | Teste unitario/integracao de logger. | Media |

## 8) Requisitos Nao Funcionais

- Performance: validacao de configuracao deve ocorrer em tempo constante no boot.
- Seguranca: proibido segredo default em codigo-fonte e proibido fallback implicito.
- Acessibilidade: nao aplicavel para interface; erros devem ser legiveis no contrato de API.
- Observabilidade: evento estruturado de `auth_config_invalid` com `requestId` quando houver requisicao.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Variaveis JWT ausentes no boot | Inicializacao abortada com mensagem tecnica objetiva. |
| ER-02 | Variaveis JWT ausentes durante requisicao de auth | `503 Service Unavailable` com codigo `AUTH_CONFIG_MISSING`. |
| ER-03 | Valor JWT vazio/whitespace | Tratado como ausente, com mesmo comportamento de misconfiguracao. |
| ER-04 | Tentativa de logar valor de segredo | Segredo mascarado/omitido do log. |

## 10) Dependencias e Restricoes

- Dependencias: modulo de configuracao/env, middleware de auth, servico JWT.
- Restricoes: compatibilidade com fluxo atual de login/refresh sem alterar contrato de sucesso.

## 11) Suposicoes

- O ambiente de producao consegue injetar variaveis secretas de forma segura.
- Ja existe padrao de erros de API para incorporar codigo de misconfiguracao.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-01, T-03 |
| AC-03 | T-03, T-04 |
| AC-04 | T-05 |
| AC-05 | T-04, T-06 |
