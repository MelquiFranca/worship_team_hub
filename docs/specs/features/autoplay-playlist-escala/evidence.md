# Evidencias - autoplay-playlist-escala

## Mudancas de Codigo

- Implementacao de fila sequencial automatica e parsing seguro de IDs YouTube:
  - `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
- Toggle de autoplay e ajustes visuais no card da playlist:
  - `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
  - `src/components/organisms/ScaleFeed/ScaleFeed.module.css`
- Atualizacao de documentacao de uso:
  - `README.md`

## Validacao Tecnica

- Comando: `npm run lint`
  - Resultado: `✔ No ESLint warnings or errors`

## Checklist de Entrega

- [x] Playlist com execucao sequencial automatica para links YouTube.
- [x] Controle de usuario para ativar/desativar autoplay.
- [x] Navegacao manual preservada (`Anterior`, `Proximo`, dots).
- [x] Fila automatica endurecida para IDs YouTube validos.
- [x] Ajuste de permissao do iframe para `compute-pressure`.
- [x] Documentacao completa gerada (`spec`, `plan`, `validation`, `evidence` e README).
