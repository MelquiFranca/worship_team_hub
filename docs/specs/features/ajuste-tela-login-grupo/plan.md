# Plano Tecnico - ajuste-tela-login-grupo

## 1) Referencia da Spec

- Feature: ajuste-tela-login-grupo
- Documento: `features/ajuste-tela-login-grupo/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Executar ajustes em tres blocos: localizacao PT-BR das strings, substituicao do header por identidade do grupo (foto + nome) e validacao final de responsividade/acessibilidade.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Traduzir textos da tela de login para PT-BR (labels, placeholders, botoes, mensagens) | AC-01, AC-02 | Manual + revisao | Checklist de strings |
| T-02 | Substituir titulo `Instagram` por bloco com foto e nome do grupo, incluindo fallback | AC-03, AC-04 | Manual visual | Capturas com e sem foto |
| T-03 | Revisar validacoes, responsividade e acessibilidade apos ajuste textual/visual | AC-02, AC-05 | Manual + lint | Checklist de QA |
| T-04 | Consolidar evidencias e atualizar validacao final | AC-01 a AC-05 | Manual | `validation.md` preenchido |

## 4) Ordem de Execucao

1. Localizar e traduzir todas as strings da tela de login (T-01).
2. Implementar identidade do grupo no topo da tela (T-02).
3. Rodar revisao funcional, responsiva e de acessibilidade (T-03).
4. Fechar evidencias e validacao (T-04).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Permanecer string em ingles nao mapeada | Medio | Media | Fazer checklist completo de textos por estado da tela. |
| Bloco de identidade do grupo quebrar layout em mobile | Medio | Media | Validar breakpoints e aplicar fallback de truncamento. |
| Regressao em mensagens de validacao | Medio | Baixa | Testar fluxo invalido e valido apos traducao. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: restaurar textos anteriores temporariamente em caso de regressao critica.
- Plano de rollback: reverter somente arquivos da tela de login.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-11 | Localizar login para PT-BR de ponta a ponta | Melhor aderencia ao publico alvo | Melhora clareza de uso |
| 2026-04-11 | Usar foto + nome do grupo no header | Reforcar identidade da aplicacao | Substitui referencia externa inadequada |
