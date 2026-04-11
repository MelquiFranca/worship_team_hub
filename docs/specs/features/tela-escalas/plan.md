# Plano Tecnico - tela-escalas

## 1) Referencia da Spec

- Feature: tela-escalas
- Documento: `features/tela-escalas/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Construir o feed por camadas: primeiro estrutura visual dos cards, depois regra de exibicao de componentes (com ordenacao/agrupamento), em seguida aba de playlist com carousel/reproducao, finalizando com acao de edicao e validacao completa.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Implementar estrutura base do card de escala (cabecalho com data/turno + rodape com botoes agrupados) | AC-01, AC-02 | Manual + componente | Screenshot e arquivo do componente |
| T-02 | Implementar estado de abas no card (default componentes, alternancia para playlist sem reload) | AC-03, AC-04 | Integracao | Teste de troca de aba |
| T-03 | Implementar lista de componentes com lider primeiro e agrupamento por funcao | AC-05, AC-06 | Unitario + manual | Teste de ordenacao/agrupamento |
| T-04 | Implementar carousel da playlist com render dos videos e reproducao por link | AC-04, AC-07 | Integracao + manual | Teste do carousel/reproducao |
| T-05 | Implementar acao do botao editar (callback/roteamento) | AC-08 | Integracao | Teste do evento/acao |
| T-06 | Garantir responsividade e acessibilidade basica dos cards | AC-02, AC-06 | Manual + lint | Checklist de a11y/responsividade |
| T-07 | Atualizar validacao da feature com evidencias finais | AC-01 a AC-08 | Manual | `validation.md` preenchido |

## 4) Ordem de Execucao

1. Estruturar card de feed e rodape de acoes (T-01).
2. Implementar controle de abas do conteudo principal (T-02).
3. Entregar visualizacao de componentes com regras de negocio (T-03).
4. Entregar visualizacao de playlist com carousel e reproducao (T-04).
5. Conectar acao de edicao (T-05).
6. Refinar acessibilidade/responsividade e consolidar validacao (T-06, T-07).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Complexidade na regra de ordenacao (lider + agrupamento por funcao) | Alto | Media | Criar funcao utilitaria testavel e cobrir com testes unitarios. |
| Links de video com formatos heterogeneos | Medio | Media | Normalizar URL suportada e fallback para item invalido. |
| Regressao visual em mobile por layout de feed | Medio | Media | Validar breakpoints desde o inicio com ajustes incrementais. |

## 6) Estrategia de Rollout

- Feature flag: Opcional (recomendado se substituir tela atual)
- Migracao necessaria: Nao
- Plano de fallback: manter rota/tela anterior ativa ate homologacao final
- Plano de rollback: reverter modulo de tela-escalas sem afetar demais rotas

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-11 | Usar card com abas locais por item do feed | Simplificar UX sem navegacao adicional | Interacao mais fluida no contexto da escala |
| 2026-04-11 | Separar render de componentes e playlist em blocos dedicados | Reduzir acoplamento e facilitar testes | Manutencao e evolucao mais simples |
