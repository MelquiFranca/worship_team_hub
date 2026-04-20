# Plano Tecnico - migracao-indisponibilidade-menu-avatar

## 1) Referencia da Spec

- Feature: migracao-indisponibilidade-menu-avatar
- Documento: `features/migracao-indisponibilidade-menu-avatar/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Migracao minima e segura: reutilizar o formulario existente de indisponibilidade em nova pagina, conectar essa rota no menu do avatar e incluir a rota na politica de paginas de membro.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Criar rota `/minha-indisponibilidade` e renderizar `ComponentUnavailabilityForm`. | AC-01 | Manual | `src/app/minha-indisponibilidade/page.js` |
| T-02 | Adicionar item `Minha indisponibilidade` no popover do avatar (MainBottomNav). | AC-02 | Manual | `src/components/organisms/MainBottomNav/MainBottomNav.jsx` |
| T-03 | Incluir nova rota em `MEMBER_PATHS` para aplicar politica de acesso. | AC-03 | Integracao | `src/lib/auth/policies.js` |

## 4) Ordem de Execucao

1. Criar pagina dedicada.
2. Atualizar menu do avatar.
3. Atualizar politica de acesso e validar.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Link de indisponibilidade aparecer para perfil errado. | Medio | Media | Exibir item apenas quando `permissions.isComponentApp` for true. |
| Nova rota sem protecao de auth. | Alto | Baixa | Incluir rota em `MEMBER_PATHS` e validar redirecionamento. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: manter acesso antigo caso a rota nova apresente regressao.
- Plano de rollback: remover link do menu e rota nova.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-20 | Criar rota separada para indisponibilidade. | Evitar perder funcionalidade ao evoluir `/editar-perfil`. | Mantem feature acessivel e desacoplada da tela de perfil. |
| 2026-04-20 | Expor atalho no mesmo popover do avatar. | Preservar descoberta no mesmo ponto de navegacao. | Menor atrito para usuario componente. |
