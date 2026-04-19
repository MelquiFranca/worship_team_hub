# Spec Funcional - integracao-grupos-admin-banco

## 1) Contexto

- Data: 2026-04-19
- Autor(a): Codex
- Status: Implementada
- Stakeholders: Produto, Frontend, Backend, QA, Lideranca tecnica

## 2) Problema

A tela administrativa de grupos (`/admin/grupos`) utilizava dados ficticios hardcoded em `src/data/groups.js`, sem refletir o estado real persistido no MongoDB.

## 3) Objetivo

Remover o uso de mocks na listagem administrativa de grupos e carregar nome, status e imagem diretamente do banco de dados.

## 4) Escopo

- Substituir o consumo de `src/data/groups.js` por consulta direta no MongoDB dentro da pagina `src/app/admin/grupos/page.js`.
- Exibir listagem com campos reais: `id`, `name`, `status` e `photo`.
- Resolver imagem do grupo a partir de `group_settings` (`photo`/`photoUrl`) com fallback para `groups.photoUrl`.
- Tratar estados de erro de carregamento e lista vazia sem quebrar a UI.

## 5) Nao-Escopo

- Criacao de fluxo de cadastro de grupos.
- Edicao de dados de grupo nesta tela.
- Alteracao do modelo de dados do MongoDB.
- Implementacao de paginacao e filtros avancados.

## 6) Usuarios e Cenarios

- Usuario-alvo: administradores que acessam a visao de grupos.
- Cenarios principais:
  - Admin acessa `/admin/grupos` e ve lista real de grupos persistidos.
  - Grupo sem imagem configurada exibe fallback visual por iniciais.
  - Banco indisponivel exibe mensagem de erro sem crash.
  - Base sem grupos exibe estado vazio orientando cadastro.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | A tela `/admin/grupos` nao consome mais `src/data/groups.js` no caminho principal. | Revisao de importacoes + busca por `@/data/groups`. | Alta |
| AC-02 | A listagem de grupos e carregada por consulta real ao MongoDB (`groups`). | Revisao de codigo + teste manual com base populada. | Alta |
| AC-03 | A imagem do card usa `group_settings.photo/photoUrl` com fallback para `groups.photoUrl`. | Revisao de codigo + teste manual com e sem foto em `group_settings`. | Alta |
| AC-04 | Quando nao houver foto, a UI exibe fallback por iniciais do grupo. | Teste manual visual com grupo sem foto. | Media |
| AC-05 | Em indisponibilidade do banco, a tela apresenta mensagem de erro sem quebrar renderizacao. | Simulacao de falha de conexao Mongo e verificacao visual. | Alta |
| AC-06 | Em lista vazia, a tela exibe estado vazio com mensagem clara. | Teste manual com collection `groups` vazia. | Media |

## 8) Requisitos Nao Funcionais

- Confiabilidade: tela deve responder de forma resiliente em erro de infraestrutura.
- Performance: consulta unica principal em `groups` e consulta complementar em `group_settings` por `groupId`.
- Compatibilidade: manter layout existente da tela administrativa sem regressao de navegacao.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | `groups` indisponivel por erro de conexao | Exibir callout de erro (`Nao foi possivel carregar os grupos do banco agora.`). |
| ER-02 | `groups` vazio | Exibir card de estado vazio (`Nenhum grupo encontrado`). |
| ER-03 | Grupo sem `name` | Exibir fallback `Grupo sem nome`. |
| ER-04 | Grupo sem foto em `group_settings` e `groups` | Exibir fallback visual por iniciais. |
| ER-05 | `status` invalido/ausente | Normalizar para `inactive` por seguranca. |

## 10) Dependencias e Restricoes

- Dependencias: `getMongoCollections`, colecoes `groups` e `group_settings`, utilitario `serializeComponentPhoto`.
- Restricoes: manter operacao sem alterar schema existente e sem endpoint novo obrigatorio.

## 11) Suposicoes

- `group_settings.groupId` armazena o identificador textual do grupo (`String(_id)` de `groups`) no contexto atual do app.
- Quando nao houver registro de `group_settings`, a tela pode usar `groups.photoUrl` ou fallback visual.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01 |
| AC-02 | T-01 |
| AC-03 | T-02 |
| AC-04 | T-03 |
| AC-05 | T-04 |
| AC-06 | T-03 |
