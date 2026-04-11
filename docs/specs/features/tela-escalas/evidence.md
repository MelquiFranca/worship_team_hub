# Evidencias - tela-escalas

## Implementacao Next.js

- Rota: `src/app/escalas/page.js`
- Estilo da rota: `src/app/escalas/page.module.css`
- Feed e card de escalas: `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
- Estilo do feed/card: `src/components/organisms/ScaleFeed/ScaleFeed.module.css`
- Dados mock de escalas e playlists: `src/data/scales.js`

## Cobertura funcional

- Cabecalho por card com data e turno.
- Rodape com botoes agrupados: componentes/playlist (esquerda) e editar escala (direita).
- Conteudo principal default em componentes com alternancia para playlist sem reload.
- Componentes exibidos com foto, nome e funcao.
- Lider exibido primeiro e demais membros agrupados por funcao.
- Playlist em formato de carousel com reproducao via iframe e fallback para links nao incorporaveis.
- Botao editar dispara acao de edicao com feedback em tela e respeita permissao de edicao.

## Validacoes executadas

- `npm run lint`: concluido sem erros.
- `npm run build`: concluido sem erros.
- Build gerou rota estatica `/escalas`.
