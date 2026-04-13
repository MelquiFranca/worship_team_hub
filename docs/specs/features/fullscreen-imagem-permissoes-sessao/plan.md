# Plano Técnico - fullscreen-imagem-permissoes-sessao

## 1) Referência da Spec

- Feature: fullscreen-imagem-permissoes-sessao
- Documento: `features/fullscreen-imagem-permissoes-sessao/spec.md`
- Versão da spec: v1
- ACs esperados:
  - AC-01: imagem abre em fullscreen a partir do gatilho de visualização.
  - AC-02: fullscreen fecha com `ESC` e com botão de fechar, restaurando o foco ao gatilho anterior.
  - AC-03: `component-app` não vê nem consegue acionar editar/excluir imagem na UI.
  - AC-04: quando houver endpoint/ação server-side, edição e exclusão de imagem são bloqueadas para `component-app` com resposta de autorização negada.
  - AC-05: logout limpa a sessão completamente, removendo estado sensível e encerrando a área autenticada.
  - AC-06: token expirado dispara limpeza da sessão e redirecionamento consistente para login.

## 2) Estratégia de Implementação

Executar em camadas pequenas para reduzir regressão e facilitar rollback:

1. Criar uma base compartilhada para fullscreen e limpeza de sessão, evitando lógica espalhada em múltiplos componentes.
2. Entregar a experiência de fullscreen com acessibilidade mínima obrigatória: foco gerenciado, `ESC`, botão de fechar e retorno de foco.
3. Aplicar a regra de permissão para `component-app` na UI, ocultando ou desabilitando editar/excluir imagem conforme o padrão do projeto.
4. Endurecer o bloqueio server-side para editar/excluir imagem quando a ação existir fora do client.
5. Centralizar logout e expiração de token em um único fluxo de limpeza de sessão.
6. Validar o comportamento com a feature flag ligada e desligada antes de considerar o rollout concluído.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidência |
| --- | --- | --- | --- | --- |
| T-01 | Criar a base compartilhada da feature: flag de rollout, helpers de fullscreen e utilitário central de limpeza de sessão | AC-01, AC-02, AC-05, AC-06 | Unitário | Testes dos helpers e do gate da flag |
| T-02 | Implementar o fullscreen da imagem com overlay/dialog, fechamento por `ESC`, botão de fechar, gerenciamento de foco e prevenção de scroll vazado | AC-01, AC-02 | Integração/UI | Render + interação por teclado |
| T-03 | Ajustar a UI de ações da imagem para `component-app` ocultar ou desabilitar editar/excluir sem quebrar outros perfis | AC-03 | UI + Integração | Snapshot/render por audiência |
| T-04 | Proteger server-side as ações de editar/excluir imagem para `component-app` quando houver endpoint/ação correspondente | AC-04 | Integração | Resposta `403`/negação de autorização |
| T-05 | Centralizar limpeza de sessão no logout e no token expirado, incluindo tokens, cookies, estado global e caches relevantes | AC-05, AC-06 | Integração | Testes de logout e de `401`/token expirado |
| T-06 | Cobrir o fluxo ponta a ponta com regressão de fullscreen, permissão e limpeza de sessão, incluindo desktop e mobile | AC-01, AC-02, AC-03, AC-05, AC-06 | E2E + Manual | Checklist de validação e capturas |

## 4) Ordem de Execução

1. T-01 para estabelecer a base de rollout e os utilitários reutilizáveis.
2. T-05 para garantir que a limpeza de sessão fique estável antes de mexer em interações de imagem.
3. T-02 para entregar a navegação em fullscreen com a experiência mínima esperada.
4. T-03 para bloquear a exposição de ações proibidas no client para `component-app`.
5. T-04 para fechar a defesa em profundidade no servidor, quando aplicável.
6. T-06 para validar o fluxo completo e registrar evidências finais.

## 5) Riscos e Mitigações

| Risco | Impacto | Probabilidade | Mitigação |
| --- | --- | --- | --- |
| A UI esconder as ações, mas o endpoint ainda aceitar edição/exclusão por chamada direta | Alto | Média | Aplicar bloqueio server-side obrigatório e testar a resposta de negação com `component-app`. |
| O fullscreen vazar listeners de teclado ou foco e afetar outras telas | Alto | Média | Encapsular listeners no componente de overlay e remover tudo no unmount/fechamento. |
| Logout ou token expirado deixarem estado residual na aplicação | Alto | Média | Centralizar a limpeza em um único helper e cobrir os dois gatilhos com testes de integração. |
| Uma flag mal posicionada criar comportamento inconsistente entre perfis | Médio | Média | Usar uma flag única para a nova experiência e manter o bloqueio server-side independente da UI. |
| Diferenças entre desktop e mobile quebrando o fechamento do fullscreen | Médio | Baixa | Validar explicitamente comportamento de teclado, toque e layout responsivo no passo de regressão. |

## 6) Estratégia de Rollout

- Feature flag: sim, por exemplo `ENABLE_FULLSCREEN_IMAGEM_PERMISSOES_SESSAO_V1`.
- Escopo da flag: controlar a nova experiência de fullscreen e o caminho de UI associado às permissões de imagem.
- Fallback: desabilitar a flag para retornar ao comportamento anterior da tela de imagem se houver regressão visual ou de interação.
- Rollback: reverter o frontend da flag e, se o bloqueio server-side fizer parte do mesmo deploy, manter o bloqueio mínimo necessário para não abrir bypass.
- Sequência recomendada: validar em local, depois em staging com contas de `component-app`, e só então liberar em produção.

## 7) Critérios de Pronto por Incremento

- [ ] A tarefa foi implementada sem alterar o escopo da feature.
- [ ] Os testes definidos para o incremento foram executados com sucesso.
- [ ] A evidência correspondente foi registrada.
- [ ] Não houve regressão crítica em outros perfis ou fluxos autenticados.
- [ ] O comportamento de fallback via feature flag foi validado quando aplicável.

## 8) Registro de Decisões Técnicas

| Data | Decisão | Motivação | Impacto |
| --- | --- | --- | --- |
| 2026-04-13 | Usar um único componente/overlay de fullscreen para a imagem | Garantir consistência de `ESC`, botão de fechar e retorno de foco | Menor duplicação e menor risco de regressão |
| 2026-04-13 | Aplicar defesa em profundidade para `component-app` (UI + servidor quando existir ação server-side) | UI sozinha não protege contra chamada direta | Aumenta a robustez de autorização |
| 2026-04-13 | Centralizar logout e expiração de token em um helper compartilhado | Evitar divergência entre fluxos que precisam limpar sessão | Reduz estado residual e bugs de navegação |
| 2026-04-13 | Usar feature flag como kill switch da nova experiência | Permitir rollout controlado e reversão rápida | Diminui risco de impacto amplo |
