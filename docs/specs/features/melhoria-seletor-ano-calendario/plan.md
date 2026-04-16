# Plano Tecnico - melhoria-seletor-ano-calendario

## 1) Referencia da Spec

- Feature: melhoria-seletor-ano-calendario
- Documento: `features/melhoria-seletor-ano-calendario/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Implementar de forma incremental no componente `Calendar`: primeiro adicionar modelo de anos e renderizacao do select rolavel, depois integrar sincronizacao com estado atual de mes/dia, em seguida propagar para formularios que reutilizam o calendario e fechar com validacoes de regressao, acessibilidade e responsividade.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Definir intervalo de anos e utilitario para gerar opcoes do select rolavel no `Calendar`. | AC-01 | Unitario | Teste do utilitario + diff do componente |
| T-02 | Implementar UI do select de ano no cabecalho do calendario mantendo semantica de formulario e foco visivel. | AC-01, AC-05 | Componente + manual | Screenshot + teste de render |
| T-03 | Sincronizar mudanca de ano com estado atual de mes/dia e validar navegacao de mes sem regressao. | AC-02, AC-03 | Integracao | Testes de interacao do calendario |
| T-04 | Garantir reuso do `Calendar` atualizado em `ComponentRegistrationForm` e `ScaleRegistrationForm` sem duplicacao. | AC-04 | Integracao | Evidencia de uso em 2 telas |
| T-05 | Aplicar ajustes de acessibilidade (`label`/`aria-label`, ordem de tab, leitura de estado) e validar com teclado/leitor. | AC-05 | Manual + auditoria a11y | Checklist de a11y + observacoes |
| T-06 | Ajustar estilos para mobile (320px a 768px) sem overflow e sem perda de usabilidade dos controles. | AC-06 | Manual responsivo | Capturas mobile |
| T-07 | Executar bateria de regressao funcional de selecao de data atual e navegacao de mes nos fluxos de cadastro. | AC-02, AC-03 | Manual + integracao | Registro em `validation.md` |
| T-08 | Consolidar evidencias, atualizar docs de validacao e registrar decisao tecnica final. | AC-01, AC-02, AC-03, AC-04, AC-05, AC-06 | Documentacao | `validation.md` e `evidence.md` |

## 4) Ordem de Execucao

1. Preparar base tecnica do select rolavel de ano no calendario (T-01, T-02).
2. Garantir consistencia de estado e regressao de interacoes de data/mes (T-03, T-07).
3. Confirmar reuso nos dois formularios consumidores (T-04).
4. Fechar requisitos de acessibilidade e responsividade (T-05, T-06).
5. Consolidar validacao e evidencias para aprovacao (T-08).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Regressao na logica de selecao de dia ao trocar ano | Alto | Media | Cobrir cenarios de mudanca de ano com testes de integracao e regressao manual guiada. |
| UX ruim em mobile por excesso de elementos no cabecalho do calendario | Medio | Media | Reorganizar layout do header com breakpoints e validar em 320px, 375px e 768px. |
| Leitor de tela nao anunciar corretamente o select de ano | Alto | Baixa | Definir nome acessivel explicito e validar com checklist de a11y antes de concluir. |
| Divergencia de comportamento entre cadastro de componentes e escalas | Medio | Baixa | Forcar consumo do mesmo componente compartilhado e testar ambos fluxos na mesma rodada. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: manter header antigo do calendario (mes + botoes) se o select causar bloqueio critico de usabilidade.
- Plano de rollback: reverter alteracoes do `Calendar` e dos formularios consumidores para a revisao anterior estavel.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-15 | Usar select nativo rolavel para ano no `Calendar` | Melhor suporte de teclado/leitor de tela e menor complexidade de manutencao | Aumenta usabilidade para intervalos longos de ano sem dependencia externa |
| 2026-04-15 | Centralizar logica de ano no componente compartilhado e reaproveitar nos 2 formularios | Evitar duplicacao e reduzir risco de comportamento divergente | Manutencao simplificada e regressao controlada |
