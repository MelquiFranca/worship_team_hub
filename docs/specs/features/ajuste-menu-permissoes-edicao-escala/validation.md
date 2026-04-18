# Validacao - ajuste-menu-permissoes-edicao-escala

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | Ajuste em `src/components/organisms/MainBottomNav/MainBottomNav.jsx` e `.module.css` com `--main-bottom-nav-columns`. | Grade passa a refletir itens visiveis para `component-app`. |
| AC-02 | Pass | Ajuste em `src/components/organisms/ScaleRegistrationForm/ScaleRegistrationForm.jsx` e `.module.css`. | Checkbox por componente para playlist/imagem e resumo de selecao. |
| AC-03 | Pass | Ajuste em `src/app/api/scales/route.js` e `src/app/api/scales/[scaleId]/route.js`. | Campos serializados e persistidos no `POST/PATCH/GET`. |
| AC-04 | Pass | Validacoes em `src/app/api/scales/route.js` e `src/app/api/scales/[scaleId]/route.js`. | API retorna `400` para IDs fora da escala. |
| AC-05 | Pass | Ajuste em `src/components/organisms/ScaleFeed/ScaleFeed.jsx` e `.module.css`. | Playlist editavel somente para componentes autorizados. |
| AC-06 | Pass | Ajuste em `src/components/organisms/ScaleFeed/ScaleFeed.jsx` e `.module.css`. | Imagem editavel somente para componentes autorizados. |
| AC-07 | Pass | Ajuste em `src/lib/api/auth.js`, `src/app/api/scales/route.js`, `src/app/api/scales/[scaleId]/route.js`, `src/app/api/components/route.js`. | Leitura para `component-app` com escopo de grupo do token. |

## Resultado final

- Status: Aprovado
- Data: 2026-04-18
- Responsavel: Codex

## Pendencias e Riscos Residuais

- Edicao de playlist no card permanece local nesta fase (sem persistencia imediata por endpoint dedicado).
- Mapeamento `usuario -> membro da escala` ainda depende de heuristica textual; ideal evoluir para chave canônica (`componentId` no token).
