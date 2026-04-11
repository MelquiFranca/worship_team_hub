# Plano Técnico - tela-login

## 1) Referência da Spec

- Feature: tela-login
- Documento: `features/tela-login/spec.md`
- Versão da spec: v1

## 2) Estratégia de Implementação

Implementar primeiro a camada visual estática para garantir fidelidade com a imagem de referência, depois conectar comportamento do formulário (validação, submit e estados), e por fim fechar com acessibilidade e testes.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidência |
| --- | --- | --- | --- | --- |
| T-01 | Criar estrutura base da página de login (container, card, seções superior e rodapé) | AC-01 | Manual | Screenshot inicial da tela |
| T-02 | Aplicar estilos visuais da referência (gradiente, tipografia, espaçamentos, botões, divisor) | AC-01, AC-05 | Manual/Visual regression | Comparativo com `assets/login.png` |
| T-03 | Implementar formulário com campos obrigatórios e mensagens de validação | AC-02 | Integração | Teste de validação passando |
| T-04 | Implementar toggle de visibilidade da senha com controle de foco | AC-03 | Unitário + Manual | Teste do componente de senha |
| T-05 | Implementar submit com estado de loading, bloqueio de múltiplos cliques e tratamento de erro | AC-04 | Integração | Testes com mock de autenticação |
| T-06 | Ajustar responsividade para mobile e desktop conforme referência | AC-05 | Manual + screenshot | Capturas em 2 breakpoints |
| T-07 | Garantir acessibilidade básica (tab order, foco visível, labels e aria) | AC-06 | Manual + lint a11y | Checklist de a11y preenchido |
| T-08 | Registrar evidências finais em `validation.md` e revisar checklist | AC-01 a AC-06 | Manual | Documento de validação atualizado |

## 4) Ordem de Execução

1. Construir estrutura base do layout (T-01).
2. Refinar estilo para fidelidade visual com a referência (T-02).
3. Implementar comportamento de formulário e validações (T-03, T-04, T-05).
4. Ajustar responsividade e acessibilidade (T-06, T-07).
5. Consolidar evidências e fechar validação (T-08).

## 5) Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
| --- | --- | --- | --- |
| Diferença visual relevante em relação à imagem de referência | Alto | Média | Validar com checklist visual objetivo e screenshots comparativas por incremento. |
| Dependência de endpoint de autenticação indisponível | Médio | Média | Trabalhar com mock/stub de autenticação até integração final. |
| Regressão de acessibilidade ao priorizar fidelidade estética | Médio | Média | Executar checklist a11y em cada incremento de UI. |

## 6) Estratégia de Rollout

- Feature flag: Não
- Migração necessária: Não
- Plano de fallback: manter rota de login antiga ativa (se existir) até validação final.
- Plano de rollback: reverter apenas módulo/tela de login para versão anterior.

## 7) Critérios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidências registradas
- [ ] Sem regressões críticas

## 8) Registro de Decisões Técnicas

| Data | Decisão | Motivação | Impacto |
| --- | --- | --- | --- |
| 2026-04-10 | Entregar em 3 fases (visual, comportamento, qualidade) | Reduzir risco de retrabalho e facilitar validação incremental | Maior previsibilidade da implementação |
| 2026-04-10 | Tratar login social como ação placeholder neste ciclo | Evitar bloqueio por integração externa | Escopo controlado e entrega mais rápida |
