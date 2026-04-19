# Plano Tecnico - ajuste-menu-admin-grupos

## 1) Referencia da Spec

- Feature: ajuste-menu-admin-grupos
- Documento: `features/ajuste-menu-admin-grupos/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Aplicar ajuste pontual no componente de navegacao administrativa (`AdminMainNav`) com foco em destino, estado ativo, acessibilidade e iconografia do primeiro botao, preservando os demais fluxos do menu.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Alterar `href` do primeiro botao para `/admin/grupos`. | AC-01 | Manual/UI | Diff em `AdminMainNav.jsx` |
| T-02 | Atualizar regra de ativo para `/admin/grupos`. | AC-02 | Manual/UI | Diff em `AdminMainNav.jsx` |
| T-03 | Ajustar `aria-label` e texto `sr-only` para `Grupos`. | AC-03 | Revisao tecnica | Diff em `AdminMainNav.jsx` |
| T-04 | Executar regressao manual basica no menu admin (novo grupo, avatar e logout) e lint do projeto. | AC-04 | Manual + Lint | Registro em `validation.md`/`evidence.md` |
| T-05 | Atualizar iconografia do primeiro botao para semantica de grupos e validar consistencia visual com o destino. | AC-05 | Revisao tecnica + Visual | Diff em `AdminMainNav.jsx` |

## 4) Ordem de Execucao

1. T-01
2. T-02
3. T-03
4. T-04
5. T-05

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Destino do menu ficar inconsistente com estado ativo | Medio | Baixa | Garantir mesma base de rota (`/admin/grupos`) no `href` e no `isActiveRoute`. |
| Regressao em acoes secundarias do menu admin | Medio | Baixa | Validar abertura do menu `Adicionar`, menu do avatar e logout apos ajuste. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: restaurar rota anterior do botao (`/admin/configuracoes`) se houver impacto operacional.
- Plano de rollback: reverter alteracoes em `AdminMainNav.jsx`.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Validacao executada
- [x] Evidencias registradas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-19 | Trocar botao principal de `Configuracoes` para `Grupos` no menu admin | Priorizar fluxo principal administrativo na navegacao primaria | Navegacao mais alinhada ao uso real do painel |
| 2026-04-19 | Atualizar icone para semantica de grupos | Coerencia visual com novo destino do atalho | Reduz ambiguidade do botao |
