# Evidencias - persistencia-imagens-escalas-banco

## Implementacao entregue

- Persistencia de `imageAttachment` no documento de escala.
- Serializacao padrao para retorno do frontend (`src` pronto para render).
- Rota de biblioteca compartilhada de imagens por grupo (`GET /api/scales/images`).
- Integracao da tela de escalas para salvar/remover/reutilizar imagem com API.

## Arquivos principais

- `src/lib/scales/imageAttachment.js`
- `src/app/api/scales/route.js`
- `src/app/api/scales/[scaleId]/route.js`
- `src/app/api/scales/images/route.js`
- `src/app/escalas/ScalesPageClient.jsx`
- `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
- `README.md`

## Evidencias de validacao

- [x] Fluxo de upload da imagem no card chama `PATCH /api/scales/:scaleId`.
- [x] Fluxo de remocao envia `imageAttachment: null`.
- [x] Biblioteca de imagens carregada por `GET /api/scales/images`.
- [x] Selecao de imagem da biblioteca persiste em outra escala.
- [x] Erros de validacao de imagem tratam tipo e tamanho maximo.
