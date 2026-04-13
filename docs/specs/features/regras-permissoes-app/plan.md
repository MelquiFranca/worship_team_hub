# Plano Técnico - regras-permissoes-app

## 1) Referência da Spec

- Feature: regras-permissoes-app
- Documento: `features/regras-permissoes-app/spec.md`
- Versão da spec: v1

## 2) Estratégia de Implementação

Implementar por camadas para minimizar regressão:

1. Consolidar resolução de permissão baseada em claims do JWT (fonte única).
2. Endurecer proteção de rotas e ações no middleware/servidor.
3. Ajustar navegação e telas para experiência de permissão por audiência.
4. Aplicar destaque visual do usuário em escalas com fallback seguro quando não houver mapeamento.
5. Validar fluxo completo por perfil (`admin-panel`, `group-app`, `component-app`).

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidência |
| --- | --- | --- | --- | --- |
| T-01 | Criar/ajustar utilitário central de resolução de permissões por JWT (`aud`, `role`, `sub`, `groupId`) para client + server | AC-01 | Unitário | Testes da matriz de permissões |
| T-02 | Revisar middleware para garantir rotas públicas de login e comportamento consistente de bloqueio (`redirect`/`403`) | AC-02, AC-10 | Integração | Testes de rota protegida/pública |
| T-03 | Validar políticas da visão Admin para `admin-panel` com acesso total à área administrativa | AC-03 | Integração + Manual | Checklist de navegação admin |
| T-04 | Validar políticas da visão Grupo para `group-app` com acesso total à área de grupo | AC-04 | Integração + Manual | Checklist de navegação grupo |
| T-05 | Ajustar `MainBottomNav` para `component-app` exibir apenas Escalas, Componentes e Avatar | AC-05 | UI/Manual | Captura de tela + teste de render |
| T-06 | Implementar restrição de edição de nome em Editar Perfil para `component-app` (readonly + bloqueio no submit) | AC-06 | Integração + Manual | Teste de formulário |
| T-07 | Garantir permissões do `component-app` em `ScaleFeed`: enviar mensagens, visualizar componentes, playlist e imagem | AC-07 | Integração | Testes de interação por aba/ação |
| T-08 | Bloquear para `component-app` as ações: notificar, editar escala/componente, inserir escala/componente | AC-08 | Integração + Manual | Testes de ausência/desabilitação + backend |
| T-09 | Reforçar bloqueio server-side para ações proibidas (defesa em profundidade) e padronizar resposta de erro | AC-08, AC-10 | Integração | Testes de endpoint com perfil incompatível |
| T-10 | Implementar destaque visual do usuário logado na lista de componentes da escala (quando participante) | AC-09 | UI/Manual + Unitário | Screenshot + teste de classe/estado |
| T-11 | Instrumentar logs mínimos de acesso negado/tentativa proibida e fechar `validation.md` | AC-10 | Manual + Integração | Logs e validação atualizados |

## 4) Ordem de Execução

1. Base de permissão e rotas (T-01, T-02).
2. Garantias de acesso por audiência em cada visão (T-03, T-04).
3. Ajustes de UI para componente (T-05, T-06, T-07, T-08).
4. Segurança server-side e padronização de erro (T-09).
5. Destaque visual e fechamento de validação (T-10, T-11).

## 5) Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
| --- | --- | --- | --- |
| Divergência entre permissão de UI e permissão server-side | Alto | Média | Implementar matriz única de permissões e testes de integração ponta a ponta. |
| Identificação incorreta do componente logado na escala | Médio | Média | Definir mapeamento explícito `sub -> componentId` com fallback seguro sem quebra. |
| Regressão de navegação para admin/grupo ao restringir menu de componente | Alto | Baixa | Validar regressão por perfil em checklist antes de merge. |
| Ações proibidas ainda acessíveis via chamada direta de endpoint | Alto | Média | Aplicar validação server-side obrigatória com resposta `403`. |
| Ambiguidade de UX entre ocultar e desabilitar ações proibidas | Médio | Média | Definir guideline por ação no início da implementação e aplicar consistentemente. |

## 6) Estratégia de Rollout

- Feature flag: Sim (ex.: `AUTHZ_APP_RULES_V1`)
- Migração necessária: Não obrigatória, salvo se for necessário persistir mapeamento extra `user -> component`.
- Plano de fallback: desabilitar flag e retornar ao comportamento atual enquanto corrige regressão.
- Plano de rollback: reverter commits da feature e restaurar regras anteriores de navegação/permissão.

## 7) Critérios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidências registradas
- [ ] Sem regressões críticas

## 8) Registro de Decisões Técnicas

| Data | Decisão | Motivação | Impacto |
| --- | --- | --- | --- |
| 2026-04-13 | JWT como fonte única de autorização funcional | Evitar inconsistência com flags locais/mock | Menor risco de bypass no client |
| 2026-04-13 | Defesa em profundidade (UI + server-side) para ações proibidas | UI isolada não é suficiente para segurança | Aumenta robustez de autorização |
| 2026-04-13 | Destaque visual do componente logado no contexto da escala | Melhorar clareza de participação do usuário | Melhora UX sem alterar regra de negócio |
