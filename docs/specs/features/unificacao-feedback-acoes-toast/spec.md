# Spec Funcional - unificacao-feedback-acoes-toast

## 1) Contexto

- Data: 2026-05-01
- Autor(a): Codex
- Status: Draft
- Stakeholders: Produto, Frontend, UX

## 2) Problema

As mensagens de retorno de acoes de persistencia (salvar/editar/excluir) estao espalhadas em banners locais, frequentemente posicionados no topo de formularios longos. No mobile, o usuario aciona salvar no fim da tela e nao visualiza imediatamente o resultado sem subir o scroll.

## 3) Objetivo

Padronizar o feedback de acoes persistentes em toast flutuante global pos-login, com exibicao imediata e consistente em mobile e desktop, incluindo fechamento automatico em 5 segundos e opcao de fechamento manual.

## 4) Escopo

- Criar provider/hook global para disparo de feedback de acao.
- Criar componente de toast reutilizavel com acessibilidade e autoclose.
- Integrar host global do toast em rotas pos-login.
- Refatorar formularios persistentes para usar o dispatcher unificado:
  - cadastro/edicao/exclusao de escala
  - cadastro/edicao/inativacao de componente
  - minha indisponibilidade (salvar)
  - configuracoes gerais do grupo (salvar)
  - admin de grupos (salvar e acao de status)
  - editar perfil (salvar)

## 5) Nao-Escopo

- Refatorar feedbacks rapidos do feed de escalas (chat/playlist/imagem/notificacao).
- Alterar tema global da aplicacao.
- Alterar validacoes inline por campo.

## 6) Usuarios e Cenarios

- Usuario-alvo: usuarios logados em fluxos de formulario (component-app, group-app e admin).
- Cenarios principais:
  - Usuario salva/edita/exclui e visualiza retorno imediatamente sem scroll adicional.
  - Usuario recebe erro de API e ve o retorno com mesmo destaque visual.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Acoes persistentes refatoradas exibem feedback via toast flutuante global imediatamente apos sucesso/erro. | Validacao manual nos fluxos listados + inspeção UI. | Alta |
| AC-02 | Toast suporta fechamento manual e fechamento automatico em 5s com reset ao receber novo evento. | Teste manual sequencial + unitario simples do provider/host (quando aplicavel). | Alta |
| AC-03 | Toast respeita acessibilidade: `role=status` em sucesso e `role=alert` em erro, com `aria-live` adequado. | Inspecao de DOM e validacao manual com leitor de tela basico. | Media |
| AC-04 | Feedbacks locais duplicados de resultado de acao sao removidos dos formularios refatorados sem quebrar erros inline de campo. | Revisao de UI + cenarios de validacao local. | Alta |
| AC-05 | Nao ha regressao de layout mobile/desktop com nav inferior e prompt de notificacao. | Validacao manual responsiva nas telas afetadas. | Media |

## 8) Requisitos Nao Funcionais

- Performance: exibicao do toast em ate 100ms apos disparo local.
- Acessibilidade: uso de roles e `aria-live` conforme severidade.
- Consistencia visual: uso de tokens de cor e estilo existentes.
- Manutenibilidade: API unica de disparo para formularios persistentes.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Novo feedback chega enquanto toast anterior esta visivel | Toast atualiza conteudo/tipo e reinicia timer de 5s. |
| ER-02 | Usuario fecha manualmente antes do autoclose | Toast some imediatamente e nao reaparece sem novo disparo. |
| ER-03 | Formulario dispara erro de validacao inline (sem requisicao) | Erros inline continuam exibidos; toast opcional somente para resultado de acao persistente. |

## 10) Dependencias e Restricoes

- Dependencias: estrutura de layout global, componentes de formulario existentes, tokens CSS globais.
- Restricoes: manter semantica atual dos formularios e nao impactar fluxos fora do escopo.

## 11) Suposicoes

- Escopo pos-login inclui rotas nao-login da aplicacao.
- Mensagens existentes de sucesso/erro de API podem ser reaproveitadas no novo canal.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-02, T-03 |
| AC-02 | T-01, T-02 |
| AC-03 | T-01, T-05 |
| AC-04 | T-03, T-05 |
| AC-05 | T-04, T-05 |
