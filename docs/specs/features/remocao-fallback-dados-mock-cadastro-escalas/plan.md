# Plano Tecnico - remocao-fallback-dados-mock-cadastro-escalas

## 1) Referencia da Spec

- Feature: remocao-fallback-dados-mock-cadastro-escalas
- Documento: `features/remocao-fallback-dados-mock-cadastro-escalas/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Remover o fallback mock de forma incremental: primeiro eliminar a fonte local e estabilizar estados da UI, depois reforcar bloqueios funcionais de submit/selecoes, preservar modo edicao com merge apenas de dados reais da escala e por fim adicionar observabilidade e validacao de regressao.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Remover import/uso de `@/data/scales` como fallback de componentes no formulario. | AC-01 | Unitario/estatico | Diff de codigo + busca de referencia |
| T-02 | Reestruturar estado de carregamento de componentes para diferenciar `loading`, `ready`, `empty`, `error`. | AC-02, AC-03, AC-04, AC-06 | Integracao frontend | Testes de estado por fixture de resposta |
| T-03 | Garantir bloqueio de interacoes dependentes de componentes (selecao e submit) quando estado for `empty` ou `error`. | AC-03, AC-06 | Integracao + Manual | Evidencia de UI desabilitada |
| T-04 | Preservar merge de componentes vindos da escala em modo edicao sem fallback global. | AC-05 | Integracao | Teste de edicao com componente legado |
| T-05 | Ajustar mensagens orientativas para erro e vazio, incluindo opcao de nova tentativa. | AC-02, AC-03, AC-06 | Manual + Snapshot | Capturas de tela/estados renderizados |
| T-06 | Validar fluxo feliz de cadastro e edicao com dados reais de API para evitar regressao funcional. | AC-04, AC-05 | Integracao + Manual | Checklist de fluxo completo |
| T-07 | Instrumentar evento/log de falha no carregamento de componentes sem dados sensiveis. | AC-07 | Unitario + Manual | Captura de log/evento |
| T-08 | Executar benchmark local antes/depois para medir impacto de performance de renderizacao inicial. | AC-08 | Performance manual | Relatorio comparativo |
| T-09 | Consolidar `validation.md` e `evidence.md` apos implementacao. | AC-01 a AC-08 | Manual | Documentacao atualizada |

## 4) Ordem de Execucao

1. Remocao do fallback e estados base de carregamento (T-01, T-02).
2. Regras funcionais de bloqueio e mensagens (T-03, T-05).
3. Preservacao de modo edicao e regressao de fluxo feliz (T-04, T-06).
4. Observabilidade e performance (T-07, T-08).
5. Consolidacao documental (T-09).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Tela de cadastro ficar inutilizavel quando backend oscilar | Alto | Media | Mensagem clara + botao de tentar novamente + suporte operacional. |
| Regressao no modo edicao para escalas antigas | Alto | Media | Teste dedicado de merge com dados da propria escala. |
| Usuarios interpretarem estado vazio como bug | Medio | Alta | Copia orientativa e instrucao de proximo passo (cadastrar componentes). |
| Aumento de chamados por erro de API apos remover mascaramento | Medio | Media | Instrumentacao de logs/eventos para diagnostico rapido. |

## 6) Estrategia de Rollout

- Feature flag: Opcional (nao obrigatoria), recomendada em homologacao para validacao gradual.
- Migracao necessaria: Nao.
- Plano de fallback: rollback de codigo da feature em caso de regressao critica no cadastro.
- Plano de rollback: restaurar versao anterior de `ScaleRegistrationForm` ate estabilizacao.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-21 | Remover fallback mock em producao e usar apenas API real | Evitar mascara de erro e inconsistencias de dados | Melhora confiabilidade operacional |
| 2026-04-21 | Tratar vazio e erro como estados distintos de UI | Dar clareza para usuario e suporte | Fluxo mais previsivel e testavel |
| 2026-04-21 | Manter merge de componentes da escala no modo edicao | Preservar consistencia de registros historicos | Evita perda de contexto em edicao |
