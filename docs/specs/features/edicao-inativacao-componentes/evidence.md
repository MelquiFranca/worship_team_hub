# Evidencias - edicao-inativacao-componentes

## Checklist de evidencias tecnicas

- [ ] Regra de autorizacao documentada e aplicada: card clicavel somente para `group-app`.
- [ ] Rota de edicao protegida contra acesso direto de perfil nao autorizado.
- [ ] Formulario em modo edicao carregando componente por id e salvando alteracoes no mesmo registro.
- [ ] Endpoint de update validando permissao e retornando erro controlado para acesso negado.
- [ ] Acao de inativacao persistindo status inativo no backend sem exclusao fisica.
- [ ] Listagem consumindo status ativo/inativo e refletindo estado apos mutacoes.
- [ ] Filtros `ativos`, `inativos` e `todos` implementados com comportamento consistente.

## Checklist de evidencias funcionais

- [ ] Usuario `group-app` consegue clicar no card e abrir formulario em modo edicao.
- [ ] Usuario `group-app` consegue salvar edicao e visualizar confirmacao de sucesso.
- [ ] Usuario `group-app` consegue inativar componente com confirmacao explicita.
- [ ] Usuario `component-app` visualiza card bloqueado e nao consegue acionar edicao.
- [ ] Tentativa de acesso direto por URL de edicao sem permissao resulta em bloqueio.
- [ ] Componente inativo aparece com estado visual diferenciado na listagem.
- [ ] Filtro de inativos exibe somente itens inativos e estado vazio correto quando aplicavel.

## Artefatos esperados

- Capturas de tela dos estados de card habilitado e bloqueado por perfil.
- Registro de teste de navegacao para redirecionamento ao modo edicao.
- Logs de teste de integracao backend para update autorizado, update negado e inativacao.
- Evidencia de regressao manual dos filtros `ativos`, `inativos` e `todos`.
- Atualizacao de `validation.md` com resultado final apos execucao dos testes.
