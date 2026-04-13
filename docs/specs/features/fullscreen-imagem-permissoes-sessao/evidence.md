# Evidencias - fullscreen-imagem-permissoes-sessao

## Escopo planejado

- Fullscreen da imagem em tela dedicada ou modal expandido.
- Restricao para `component-app` editar ou excluir imagem da escala.
- Limpeza de sessao em logout e em expiracao de token.

## Checklist de evidencias

### Fullscreen

- [ ] Captura de tela da imagem aberta em fullscreen no fluxo principal.
- [ ] Evidencia de fechamento do fullscreen por acao prevista na interface.
- [ ] Evidencia de bloqueio de rolagem ou foco mantido enquanto o fullscreen estiver ativo.

### Permissao de imagem para componente

- [ ] Evidencia visual de `component-app` com visualizacao de imagem habilitada.
- [ ] Evidencia visual de `component-app` sem controles de editar/excluir imagem.
- [ ] Evidencia de bloqueio em rota, acao ou request para tentativa indevida de editar/excluir imagem.
- [ ] Evidencia de mensagem ou estado consistente para permissao negada.

### Sessao em logout e token expirado

- [ ] Evidencia de limpeza de storage, cookies ou estado global apos logout.
- [ ] Evidencia de redirecionamento para login apos logout.
- [ ] Evidencia de limpeza de sessao quando o token expirar.
- [ ] Evidencia de retorno seguro para login sem manter estado autenticado antigo.

## Validacoes executadas

- Em planejamento. As evidencias tecnicas serao registradas apos a implementacao incremental.
