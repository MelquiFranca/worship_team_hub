# Spec Funcional - correcao-hidratacao-edicao-escala-permissoes

## 1) Contexto

- Data: 2026-04-29
- Autor(a): Codex (GPT-5)
- Status: Implemented
- Stakeholders: Produto, Frontend, usuarios `group-app`

## 2) Problema

Ao abrir a tela de edicao de escala, componentes ja escalados podem nao aparecer na lista visual quando entram por fallback da carga da escala, e os marcadores de permissao de edicao (playlist/imagem) deixam de ser exibidos para esses componentes.

## 3) Objetivo

Garantir que a tela de edicao hidrate e exiba corretamente os componentes ja selecionados e seus estados de permissao de edicao, mesmo durante fallback de dados parciais.

## 4) Escopo

- Ajustar normalizacao/merge de componentes carregados da escala para preservar metadados usados no filtro por categoria.
- Garantir que itens carregados por fallback permaneçam visiveis na categoria ativa da escala.
- Preservar exibicao dos checkboxes de permissao vinculados aos componentes carregados.

## 5) Nao-Escopo

- Alterar regras de autorizacao no backend de escalas.
- Alterar contrato da API de componentes.
- Redesenhar interface visual do formulario.

## 6) Usuarios e Cenarios

- Usuario-alvo: lider `group-app` que edita escala existente.
- Cenarios principais:
  - Usuario abre edicao de escala e visualiza os componentes ja selecionados.
  - Usuario abre edicao de escala e visualiza os checks de permissao previamente salvos.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Ao abrir edicao, componentes vindos da escala por fallback continuam visiveis na lista da categoria da escala. | Teste manual em `/cadastro-escalas?scaleId=<id>` com escala existente. | Alta |
| AC-02 | Ao abrir edicao, estados de permissao `Editar playlist` e `Editar imagem` ja salvos continuam refletidos na UI para os componentes exibidos. | Teste manual no card de componentes com escala contendo permissoes salvas. | Alta |
| AC-03 | Ajuste nao altera payload de submit existente para criacao/edicao. | Revisao de diff + teste manual de salvar escala. | Media |

## 8) Requisitos Nao Funcionais

- Performance: sem novas chamadas de rede e sem loops adicionais custosos.
- Seguranca: nao ampliar privilegios; somente ajuste de hidratação visual.
- Acessibilidade: manter controles existentes e estados `checked/disabled` coerentes.
- Observabilidade: manter logs de erro ja existentes sem regressao.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | API de componentes retorna incompleto e fallback da escala e usado | Componentes do fallback ainda aparecem na categoria ativa da escala. |
| ER-02 | Escala sem categoria explicita | UI aplica categoria padrao e mantem componentes visiveis quando adicionados por fallback. |

## 10) Dependencias e Restricoes

- Dependencias: `ScaleRegistrationForm`, dados de `/api/scales/:id` e `/api/components`.
- Restricoes: preservar comportamento atual de cadastro e validacoes existentes.

## 11) Suposicoes

- Escalas legadas podem nao trazer metadados completos dos componentes no payload de detalhe.
- Filtro por categoria da UI depende de `categoryTagIds` no componente carregado no estado local.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-01, T-02 |
| AC-03 | T-02 |
