# Evidencias - ajuste-menu-permissoes-edicao-escala

## Mudancas de Codigo

- Menu inferior dinamico:
  - `src/components/organisms/MainBottomNav/MainBottomNav.jsx`
  - `src/components/organisms/MainBottomNav/MainBottomNav.module.css`
- Permissoes granulares no cadastro/edicao de escala:
  - `src/components/organisms/ScaleRegistrationForm/ScaleRegistrationForm.jsx`
  - `src/components/organisms/ScaleRegistrationForm/ScaleRegistrationForm.module.css`
- Aplicacao das permissoes no feed:
  - `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
  - `src/components/organisms/ScaleFeed/ScaleFeed.module.css`
  - `src/app/escalas/ScalesPageClient.jsx`
- Contrato e validacao backend:
  - `src/app/api/scales/route.js`
  - `src/app/api/scales/[scaleId]/route.js`
  - `src/lib/api/auth.js`
  - `src/app/api/components/route.js`
- Dados de apoio/mock:
  - `src/data/scales.js`

## Validacao Tecnica

- Comando: `npm run lint`
  - Resultado: `✔ No ESLint warnings or errors`
- Comando: `npm run build`
  - Resultado: build concluido com sucesso em Next.js 15.5.15, sem falhas de compilacao/tipagem.

## Checklist de Entrega

- [x] Alinhamento do menu para `component-app` corrigido (centralizado por colunas dinamicas).
- [x] Cadastro/edicao de escala permite selecionar componentes com permissao de editar playlist.
- [x] Cadastro/edicao de escala permite selecionar componentes com permissao de editar imagem.
- [x] API persiste e devolve `playlistEditorComponentIds` e `imageEditorComponentIds`.
- [x] API bloqueia IDs de permissao fora da lista de componentes da escala.
- [x] Feed respeita permissao granular para edicao de playlist/imagem no card.
- [x] Documentacao completa gerada (`spec`, `plan`, `validation`, `evidence`).
