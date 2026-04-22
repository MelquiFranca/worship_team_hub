# Spec Funcional - baseline-env-producao-e-segredos

## 1) Contexto

- Data: 2026-04-21
- Autor(a): Codex
- Status: Done
- Stakeholders: Produto, Backend, DevOps, Seguranca, QA

## 2) Problema

O projeto possui lacunas no baseline de configuracao para producao: o arquivo `.env.example` nao cobre todas as variaveis obrigatorias efetivamente usadas pela aplicacao (especialmente autenticacao JWT/Auth) e ainda precisa refletir corretamente requisitos condicionais de integracoes (YouTube), gerando risco de deploy com ambiente incompleto, segredos inconsistentes e bloqueio indevido de bootstrap.

## 3) Objetivo

Definir e implementar um baseline de ambiente de producao com inventario completo de variaveis obrigatorias e opcionais, padronizacao de segredos criticos, validacao de boot da aplicacao e documentacao operacional para reduzir falhas de configuracao e riscos de seguranca no go-live.

## 4) Escopo

- Levantar variaveis de ambiente realmente consumidas pelo codigo da aplicacao.
- Atualizar `.env.example` com todas as variaveis obrigatorias e condicionais, com placeholders seguros.
- Classificar variaveis por categoria (`required`, `optional`, `conditional`, `sensitive`, `public`).
- Definir regras minimas de seguranca para segredos (JWT/Auth/API keys) e proibicao de fallback inseguro em producao.
- Adicionar validacao de ambiente na inicializacao (falhar rapido quando obrigatorias ausentes/invalidas) sem bloquear bootstrap por integracao opcional ainda nao utilizada.
- Documentar procedimento de provisionamento e rotacao de segredos para operacao.

## 5) Nao-Escopo

- Implementacao de secret manager especifico de nuvem (AWS/GCP/Azure) nesta etapa.
- Rotacao automatica de segredos em runtime.
- Mudancas funcionais de regras de negocio fora do tema ambiente/segredos.
- Revisao completa de toda a arquitetura de autenticacao alem dos ajustes minimos de baseline.

## 6) Usuarios e Cenarios

- Usuario-alvo:
  - Engenheiros de backend e frontend responsaveis pelo deploy.
  - Time de DevOps/Plataforma responsavel pelo ambiente produtivo.
- Cenarios principais:
  - Time prepara variaveis para novo ambiente (staging/producao) sem omissoes.
  - Aplicacao recusa boot quando segredo critico esta ausente ou fraco.
  - Auditoria tecnica confirma que nenhum segredo real esta versionado e que placeholders estao corretos.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Existe inventario completo das variaveis de ambiente utilizadas pelo codigo e seu mapeamento de obrigatoriedade. | Revisao tecnica do inventario + busca no codigo por `process.env`. | Alta |
| AC-02 | `.env.example` inclui todas as variaveis obrigatorias de bootstrap e variaveis condicionais de integracao (incluindo YouTube), com placeholders nao sensiveis e classificacao explicita. | Diff do arquivo + checklist de cobertura comparado ao inventario. | Alta |
| AC-03 | Aplicacao falha de forma explicita ao iniciar em producao quando variavel obrigatoria de bootstrap estiver ausente ou invalida, sem bloquear boot por ausencia de `YOUTUBE_API_KEY` quando o recurso nao for usado no startup. | Teste manual/integracao de boot com matriz de ambientes validos/invalidos. | Alta |
| AC-04 | Nao existe fallback inseguro de segredo em producao (ex.: segredo hardcoded para JWT/Auth). | Revisao de codigo + teste de inicializacao em `NODE_ENV=production`. | Alta |
| AC-05 | Documento operacional de ambiente e segredos descreve provisionamento, validacao pre-deploy e rotacao baseline. | Revisao documental por engenharia/DevOps. | Media |
| AC-06 | Build/lint e smoke test de autenticacao continuam funcionais apos os ajustes de baseline. | Execucao de pipeline local/CI + teste de login/refresh. | Alta |

## 8) Requisitos Nao Funcionais

- Seguranca: segredos obrigatorios com comprimento minimo e sem valores default conhecidos em producao.
- Confiabilidade: falha rapida de configuracao com mensagens acionaveis, evitando erros silenciosos em runtime.
- Observabilidade: logs de configuracao sem exposicao de valores sensiveis.
- Manutenibilidade: convencao de nomenclatura e documentacao unificada para variaveis de ambiente.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Variavel obrigatoria de bootstrap ausente em `NODE_ENV=production` | Aplicacao interrompe bootstrap com erro claro indicando o nome da variavel ausente. |
| ER-02 | Segredo JWT/Auth abaixo do minimo aceito (ex.: muito curto) | Inicializacao bloqueada com mensagem padronizada de requisito de seguranca. |
| ER-03 | `.env.example` divergente das variaveis realmente usadas | Checklist de validacao pre-merge falha e bloqueia liberacao. |
| ER-04 | Tentativa de fallback hardcoded para segredo em producao | Execucao rejeitada; log indica configuracao insegura. |
| ER-05 | `YOUTUBE_API_KEY` ausente em producao sem uso inicial do recurso YouTube | Bootstrap permitido; aplicacao inicia normalmente. |
| ER-06 | `YOUTUBE_API_KEY` ausente e endpoint/recurso YouTube acionado | Recurso retorna erro acionavel de configuracao sem derrubar o processo inteiro. |

## 10) Dependencias e Restricoes

- Dependencias:
  - Modulos de autenticacao e middleware de sessao/tokens.
  - Arquivos de configuracao de ambiente do projeto (`.env.example`, docs de setup).
  - Pipeline de validacao (`lint`, `build`, smoke tests de auth).
- Restricoes:
  - Nao versionar segredos reais no repositorio.
  - Manter compatibilidade com fluxo atual de deploy sem exigir plataforma proprietaria.

## 11) Suposicoes

- Variaveis criticas de autenticacao incluem ao menos chaves/segredos JWT/Auth e configuracoes de refresh.
- Integracao YouTube depende de `YOUTUBE_API_KEY`, tratada como segredo sensivel e obrigatoria apenas quando o recurso for acionado.
- O projeto executa em ambiente que permite injecao de variaveis por pipeline/plataforma de deploy.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-02, T-03 |
| AC-03 | T-04 |
| AC-04 | T-05 |
| AC-05 | T-06 |
| AC-06 | T-07 |

Status de rastreabilidade em 2026-04-22:
- Cobertura documental atualizada e rastreavel: AC-01, AC-02, AC-03, AC-04, AC-05, AC-06.
