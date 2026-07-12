# Plano Técnico - filtro-categorias-escalas-design-cadastro

## 1) Referência da Spec

- Feature: filtro-categorias-escalas-design-cadastro
- Documento: `features/filtro-categorias-escalas-design-cadastro/plan.md`
- Versão da spec: v1

## 2) Estratégia de Implementação

Alterar o filtro de categorias da tela de escalas do grupo para reutilizar o mesmo padrão visual do seletor de categoria da tela de cadastro de escalas: botões segmentados em grid, com estado ativo destacado por gradiente/acento. A lógica de filtro deve continuar local ao `ScaleFeed`, sem alterar API, persistência ou o componente de cadastro.

Escopo:
- Substituir a aparência de chips/tags do filtro de categorias em `ScaleFeed`.
- Manter o filtro funcional para as categorias configuradas do grupo.
- Preservar acessibilidade básica com grupo identificado e estado pressionado.
- Ajustar CSS responsivo para o seletor caber em mobile e desktop.

Não-escopo:
- Alterar cadastro/edição de escalas.
- Alterar cadastro de categorias do grupo.
- Alterar contrato de API ou modelo de dados.
- Alterar o selo de categoria exibido nos cards de escala.

Critérios de aceite:
- AC-01: O filtro de categorias da tela `/escalas` deixa de usar visual de tags/chips e passa a usar botões segmentados equivalentes ao seletor de categoria do cadastro de escalas.
- AC-02: Clicar em uma categoria ativa somente ela no filtro e desativa qualquer outra categoria anteriormente ativa.
- AC-03: O filtro mantém estado visual ativo/inativo, foco visível e `aria-pressed` por categoria.
- AC-04: O layout permanece responsivo em telas estreitas, sem overflow horizontal ou texto sobreposto nos botões.
- AC-05: Para login de componente, o filtro exibe todas e somente as categorias vinculadas ao componente logado; se o componente pertencer a duas categorias, ambas devem aparecer, mas somente uma fica ativa por vez. Para login de grupo/admin, o filtro continua exibindo as categorias disponíveis do grupo.
- AC-06: O filtro de categorias se comporta como toggle de seleção única: ao ativar uma categoria, as demais são desativadas automaticamente, sem estado de múltiplas categorias ativas.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidência |
| --- | --- | --- | --- | --- |
| T-01 | Mapear implementação atual em `ScaleFeed` e referência visual em `ScaleRegistrationForm` | AC-01 | Revisão estática | Concluído: `ScaleFeed.jsx`, `ScaleFeed.module.css`, `ScaleRegistrationForm.jsx`, `ScaleRegistrationForm.module.css` revisados |
| T-02 | Alterar markup/classes do filtro de categorias em `ScaleFeed` para grupo segmentado | AC-01, AC-02, AC-03 | Revisão estática | Concluído: `ScaleFeed.jsx` usa `categoryFilterGroup` e `categoryFilterButton` com `aria-pressed` |
| T-03 | Ajustar CSS do filtro em `ScaleFeed.module.css` para equivalência visual e responsividade | AC-01, AC-03, AC-04 | Revisão estática | Concluído: grid responsivo, botão 48px, gradiente ativo e foco visível |
| T-04 | Executar verificação automatizada disponível e revisar checklist | AC-01, AC-02, AC-03, AC-04 | Unitário/estático | Concluído: `npm test -- --test-name-pattern=category` passou, executando unitários, integração e smoke |
| T-05 | Resolver categorias do componente logado em `/escalas` e limitar opções visíveis do filtro quando aplicável | AC-05 | Revisão estática/unitário | Concluído: `ScalesPageClient.jsx` passa todos os `categoryTagIds` do componente logado; `ScaleFeed.jsx` limita opções visíveis quando `sessionCategoryTagIds` existe |
| T-06 | Alterar comportamento do filtro para seleção única estilo toggle | AC-02, AC-06 | Revisão estática/unitário | Concluído: `ScaleFeed.jsx` inicializa com um ID e `onClick` substitui a seleção por `[tag.id]` |

## 4) Ordem de Execução

1. Criar spec/plano obrigatório.
2. Atualizar JSX do filtro de categorias.
3. Atualizar CSS do filtro.
4. Executar testes viáveis.
5. Registrar evidências, pendências e riscos residuais.

## 5) Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
| --- | --- | --- | --- |
| Resetar o filtro para múltiplas categorias quando as opções mudarem | Médio | Média | Definir default como primeira categoria disponível e guardar no máximo um ID selecionado |
| Botões longos causarem overflow em mobile | Médio | Média | Usar grid responsivo com `minmax`, quebra de linha e `overflow-wrap` |
| Mudança afetar estilos dos cards de escala | Baixo | Baixa | Remover/alterar apenas classes do filtro, mantendo `.categoryTag` dos cards |

## 6) Estratégia de Rollout

- Feature flag: Não
- Migração necessária: Não
- Plano de fallback: restaurar classes/markup anteriores do filtro de categorias em `ScaleFeed`.
- Plano de rollback: reverter mudanças em `ScaleFeed.jsx`, `ScaleFeed.module.css` e neste plano.

## 7) Critérios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidências registradas
- [x] Sem regressões críticas

## 8) Registro de Decisões Técnicas

| Data | Decisão | Motivação | Impacto |
| --- | --- | --- | --- |
| 2026-07-12 | Manter multisseleção com visual segmentado | A tela atual filtra por múltiplas categorias; o pedido é de design, não de regra de negócio | Usuário mantém comportamento atual com aparência alinhada ao cadastro |
| 2026-07-12 | Aplicar escopo de categorias apenas para `component-app` | O pedido menciona componente logado; usuários de grupo/admin não têm uma categoria própria de componente | Login de componente vê apenas suas categorias; grupo/admin preserva visão completa |
| 2026-07-12 | Trocar multisseleção por seleção única | O filtro deve funcionar como toggle em que um botão ativo desativa os demais | Lista visível passa a refletir uma única categoria ativa por vez |

## 9) Revisão Final

- Checklist usado: `docs/specs/references/review-checklist.md`
- Cobertura de AC: AC-01 coberto por `ScaleFeed.jsx`/`ScaleFeed.module.css`; AC-02 e AC-06 cobertos por seleção única em `ScaleFeed.jsx`; AC-03 coberto por `aria-pressed` e foco visível; AC-04 coberto por grid responsivo e `overflow-wrap`; AC-05 coberto por `ScalesPageClient.jsx` e `ScaleFeed.jsx`, exibindo as categorias do componente logado com somente uma ativa por vez.
- Pendências: Nenhuma bloqueante.
- Riscos residuais: Sem validação visual em navegador nesta rodada; risco baixo porque a mudança replica tokens/classes visuais já usados no cadastro.
- Evidência de testes: `npm test -- --test-name-pattern=category` em 2026-07-12, com 60 unitários, 8 integração e 4 smoke passando. Executado novamente após AC-05 e AC-06 com o mesmo resultado.
