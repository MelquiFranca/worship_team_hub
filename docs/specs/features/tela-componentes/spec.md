# Spec Funcional - tela-componentes

## 1) Contexto

- Data: 2026-04-11
- Autor(a): Codex
- Status: Proposed
- Stakeholders: Produto, Frontend, UX, Lideranca

## 2) Problema

A aplicacao ainda nao possui uma tela dedicada para visualizacao de componentes em formato de galeria. Isso dificulta a consulta rapida dos membros e quebra a consistencia da experiencia visual em relacao a tela de escalas.

## 3) Objetivo

Implementar uma tela de componentes com a mesma identidade visual da tela de escalas, exibindo todos os componentes em blocos de icone com foto e nome, organizados em ate 3 itens por fileira.

## 4) Escopo

- Criar tela/rota de componentes com estrutura visual alinhada a tela de escalas.
- Exibir lista completa de componentes em layout de grade.
- Exibir cada componente em bloco com:
  - Foto do componente.
  - Nome do componente.
- Garantir distribuicao em ate 3 blocos por fileira em desktop.
- Garantir que a foto seja exibida em formato quadrado com bordas arredondadas.
- Garantir comportamento responsivo para tablet e mobile sem quebra de layout.

## 5) Nao-Escopo

- Cadastro/edicao de componentes.
- Integracao com backend para CRUD completo de componentes.
- Filtros avancados (funcao, ministerio, disponibilidade).
- Ordenacao customizavel pelo usuario.

## 6) Usuarios e Cenarios

- Usuario-alvo: lideres, ministros e membros que consultam escala e equipe.
- Cenarios principais:
  - Usuario abre a tela de componentes e visualiza rapidamente todos os membros.
  - Usuario identifica nome e foto de cada componente em layout uniforme.
  - Usuario navega em diferentes tamanhos de tela sem perder legibilidade da grade.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | A tela de componentes mantem identidade visual consistente com a tela de escalas (cores, tipografia, bordas, sombras e espacamentos). | Revisao manual comparativa entre telas. | Alta |
| AC-02 | Todos os componentes sao exibidos em blocos com foto e nome. | Teste manual de renderizacao com base de dados completa. | Alta |
| AC-03 | O layout exibe no maximo 3 blocos por fileira em desktop. | Teste manual responsivo em viewport desktop. | Alta |
| AC-04 | A foto de cada componente e quadrada com bordas arredondadas e recorte proporcional. | Teste manual visual + inspeção CSS (`aspect-ratio`, `border-radius`, `object-fit`). | Alta |
| AC-05 | Em telas menores, a grade se ajusta sem sobreposicao/corte de conteudo. | Teste manual em breakpoints mobile e tablet. | Media |

## 8) Requisitos Nao Funcionais

- Performance: renderizacao da grade deve ocorrer sem travamentos perceptiveis na abertura da tela.
- Acessibilidade: imagens com `alt` descritivo e foco visivel em elementos interativos (quando aplicavel).
- Consistencia visual: reutilizar tokens/estilos da tela de escalas para reduzir divergencia estetica.
- Manutenibilidade: estrutura em componente reutilizavel para futura evolucao (ex.: filtros e busca).

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Lista de componentes vazia | Exibir estado vazio com mensagem clara ao usuario. |
| ER-02 | Foto ausente/URL invalida | Exibir imagem fallback mantendo bloco com dimensao padrao. |
| ER-03 | Nome muito longo | Truncar ou quebrar linha sem quebrar a grade. |

## 10) Dependencias e Restricoes

- Dependencias: estrutura Next.js atual, dados de componentes e padrao visual existente da tela de escalas.
- Restricoes: manter coerencia visual com a identidade ja estabelecida, evitando criar um novo estilo paralelo.

## 11) Suposicoes

- Existe fonte de dados de componentes com ao menos `id`, `name` e `photo`.
- A rota de componentes sera acessada dentro do fluxo principal da aplicacao.
- O primeiro incremento sera orientado a exibicao (sem acoes de edicao).

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-03 |
| AC-03 | T-02 |
| AC-04 | T-03 |
| AC-05 | T-04 |
