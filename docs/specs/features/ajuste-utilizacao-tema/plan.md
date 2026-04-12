# Plano Tecnico - ajuste-utilizacao-tema

## 1) Referencia da Spec

- Feature: ajuste-utilizacao-tema
- Documento: `features/ajuste-utilizacao-tema/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Executar migracao por ondas: mapear estilos legados, substituir por tokens globais, validar estados interativos e finalizar com checklist visual completo nas telas-chave.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Mapear ocorrencias de estilos hardcoded em componentes graficos e priorizar por impacto visual | AC-01 | Revisao tecnica | Inventario de arquivos |
| T-02 | Migrar cores de texto/superficie/borda para tokens globais em componentes e paginas principais | AC-01, AC-02 | Manual + revisao | Diff dos estilos migrados |
| T-03 | Migrar estados interativos (hover/focus/active/disabled) para tokens | AC-02, AC-03 | Manual + a11y | Checklist de estados |
| T-04 | Executar validacao de consistencia por troca controlada de tokens centrais | AC-04 | Manual visual | Capturas antes/depois |
| T-05 | Validar fallback de tokens ausentes e fechar evidencias | AC-05 | Manual + regressao | `validation.md` atualizado |

## 4) Ordem de Execucao

1. Levantar inventario de estilos legados (T-01).
2. Migrar estrutura visual base para tokens (T-02).
3. Padronizar estados interativos e foco (T-03).
4. Validar reatividade ao tema (T-04).
5. Testar fallback e consolidar validacao final (T-05).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Regressao visual ampla por troca massiva de estilos | Alto | Media | Migrar por lotes pequenos e validar por tela. |
| Componentes esquecidos fora da migracao | Medio | Media | Usar checklist por rota/componente e busca automatizada. |
| Queda de contraste em alguns tokens | Alto | Media | Revisar contraste em estados chave antes do aceite final. |

## 6) Estrategia de Rollout

- Feature flag: Opcional
- Migracao necessaria: Nao
- Plano de fallback: manter tokens anteriores ate homologacao visual.
- Plano de rollback: reverter lote de migracao com regressao detectada.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-11 | Priorizar migracao por tokens globais no `:root` | Garantir reaproveitamento e padrao unico | Reduz custo de manutencao futura |
| 2026-04-11 | Validar com troca controlada de token | Confirmar aplicacao transversal do tema | Detecta lacunas de consumo rapidamente |
