# Validacao - persistencia-imagens-escalas-banco

## 1) Matriz de criterios

| Criterio | Status | Evidencia |
| --- | --- | --- |
| AC-01 Upload de imagem persiste e retorna no `GET /api/scales` | Pass | `src/lib/scales/imageAttachment.js`, `src/app/api/scales/route.js` |
| AC-02 Remocao com `imageAttachment: null` no `PATCH` | Pass | `src/app/api/scales/[scaleId]/route.js` |
| AC-03 Biblioteca de imagens por grupo disponivel | Pass | `src/app/api/scales/images/route.js` |
| AC-04 Reuso de imagem em outras escalas via UI | Pass | `src/components/organisms/ScaleFeed/ScaleFeed.jsx`, `src/app/escalas/ScalesPageClient.jsx` |
| AC-05 Validacao de tipo/tamanho e erros 400 | Pass | `src/lib/scales/imageAttachment.js`, validacoes cliente em `ScaleFeed.jsx` |

## 2) Checklist manual sugerido

1. Abrir `/escalas` e fazer upload de imagem em uma escala com permissao.
2. Recarregar a tela e confirmar imagem persistida no card.
3. Abrir outra escala, selecionar imagem da galeria e salvar.
4. Confirmar `GET /api/scales/images` retornando a imagem para o grupo.
5. Remover imagem de uma escala e validar retorno sem `imageAttachment`.

## 3) Riscos residuais

- Nao foi adicionada suite automatizada de integracao para uploads de imagem de escala.
- Em grupos com muitas imagens, pode ser necessario paginação dedicada para `GET /api/scales/images`.
