# Plano Tecnico - evolucao-tela-escalas

## 1) Referencia da Spec

- Feature: evolucao-tela-escalas
- Documento: `features/evolucao-tela-escalas/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Evoluir o card de escala sem alterar a hierarquia principal da tela: primeiro estruturar o estado de expandido/compacto por card, depois ajustar o rodape com `Notificar` ao lado esquerdo de `Editar escala`, em seguida tratar acessibilidade e responsividade para garantir que a reducao de conteudo nao quebre leitura nem interacoes.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Implementar estado de expandir/compactar por card com identificador estavel e acao de toggle | AC-01, AC-07, AC-08 | Integracao | Log ou teste do estado por card |
| T-02 | Adicionar botao `Notificar` no rodape do card, posicionado a esquerda de `Editar escala` | AC-03, AC-04, AC-08 | Integracao | Screenshot e teste do evento |
| T-03 | Ajustar renderizacao das versoes compacta e expandida, mantendo na compacta apenas cabecalho com data e turno | AC-02, AC-03, AC-06 | Visual + manual | Screenshot responsivo dos dois estados |
| T-04 | Garantir acessibilidade e responsividade dos controles do card em desktop e mobile | AC-05, AC-06 | Manual + a11y | Checklist de teclado, foco e breakpoints |
| T-05 | Consolidar validacao final e registrar evidencias da entrega | AC-01 a AC-08 | Manual | `validation.md` preenchido |

## 4) Ordem de Execucao

1. Implementar o controle de estado por card com toggle independente.
2. Atualizar o rodape do card com o botao `Notificar` antes de `Editar escala`.
3. Ajustar a diferenca entre visao compacta e expandida.
4. Validar acessibilidade, responsividade e estabilidade do estado.
5. Registrar a validacao final e evidencias.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Perda de estado expandido apos re-render da lista | Alto | Media | Usar chave/identificador estavel e estado local bem delimitado por card. |
| Quebra do alinhamento do rodape com a inclusao de `Notificar` | Medio | Media | Revisar layout por breakpoint e validar espacamento antes de fechar a tarefa. |
| Card compacto continuar exibindo partes do conteudo antigo | Alto | Media | Criar regra unica de renderizacao para cada modo e cobrir com teste visual. |
| Regressao de navegacao por teclado no toggle ou nos botoes | Alto | Baixa | Validar foco, tab order e `aria-expanded` em todos os controles. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: manter a renderizacao atual do card como referencia ate validar a nova interacao em homologacao.
- Plano de rollback: reverter apenas o bloco de card e o rodape do componente, sem tocar em rotas ou dados.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-11 | Controlar expansao por card com estado local e identificador estavel | Evitar interferencia entre cards e simplificar a experiencia | Menor risco de reset indevido ao interagir com a lista |
| 2026-04-11 | Exibir somente cabecalho no modo compacto | Reduzir ruido visual e acelerar a leitura da tela | Melhor escaneabilidade em listas longas e em mobile |
| 2026-04-11 | Posicionar `Notificar` imediatamente antes de `Editar escala` | Manter a acao de edicao como ultima opcao secundaria do card | Hierarquia de acoes mais clara para o usuario |
