# Spec Funcional - persistencia-imagens-escalas-banco

## 1) Contexto

- Data: 2026-04-19
- Autor(a): Codex
- Status: Implementado
- Stakeholders: Produto, Frontend, Backend, QA

## 2) Problema

As imagens das escalas eram manipuladas no frontend sem persistencia confiavel no banco para todo o ciclo de consulta e reutilizacao entre escalas.

## 3) Objetivo

Persistir imagens das escalas no MongoDB e disponibilizar consulta centralizada para reuso em outras escalas do mesmo grupo.

## 4) Escopo

- Persistir `imageAttachment` em `scales` no `POST/PATCH`.
- Retornar `imageAttachment` no `GET /api/scales`.
- Expor biblioteca de imagens via `GET /api/scales/images`.
- Permitir remover imagem com `PATCH` usando `imageAttachment: null`.
- Integrar tela de escalas para salvar/remover/reutilizar imagens via API.

## 5) Nao-Escopo

- Edicao de imagem (crop, resize, filtros).
- Storage externo (S3/Cloudinary).
- Versionamento de multiplas imagens por escala no mesmo documento.

## 6) Regras de negocio

| Regra | Descricao |
| --- | --- |
| R-01 | `imageAttachment.src` pode ser data URL base64 valida ou URL HTTP/HTTPS. |
| R-02 | Para data URL: tipos aceitos `image/jpeg`, `image/png`, `image/webp`, `image/gif`. |
| R-03 | Limite maximo de upload base64: `2MB`. |
| R-04 | `PATCH /api/scales/:scaleId` com `imageAttachment: null` remove a imagem atual. |
| R-05 | `GET /api/scales/images` retorna imagens do grupo para reuso entre escalas. |
| R-06 | `component-app` so pode editar imagem quando estiver em `imageEditorComponentIds`. |

## 7) Contrato de API

### 7.1 PATCH /api/scales/:scaleId

```json
{
  "imageAttachment": {
    "id": "scale-image-1",
    "src": "data:image/png;base64,iVBORw0...",
    "label": "Imagem do dispositivo",
    "alt": "Imagem enviada do dispositivo",
    "sourceScaleId": "escala-1",
    "sourceScaleLabel": "2026-04-19 - Noite"
  }
}
```

Remocao:

```json
{
  "imageAttachment": null
}
```

### 7.2 GET /api/scales/images

```json
{
  "items": [
    {
      "id": "scale-image-1",
      "src": "data:image/png;base64,iVBORw0...",
      "label": "Imagem da escala",
      "alt": "Imagem da escala",
      "sourceScaleId": "escala-1",
      "sourceScaleLabel": "2026-04-19 - Noite"
    }
  ],
  "count": 1,
  "groupId": "grupo-1"
}
```

## 8) Criterios de aceite

| ID | Criterio |
| --- | --- |
| AC-01 | Upload de imagem da escala e persistido no MongoDB e retornado no `GET /api/scales`. |
| AC-02 | Remocao de imagem com `imageAttachment: null` funciona via `PATCH`. |
| AC-03 | `GET /api/scales/images` lista imagens reutilizaveis do grupo. |
| AC-04 | Frontend permite selecionar imagem da biblioteca e salvar em outra escala. |
| AC-05 | Validacoes de tipo/tamanho de imagem retornam erro `400` quando invalidas. |

## 9) Arquivos impactados

- `src/lib/scales/imageAttachment.js`
- `src/app/api/scales/route.js`
- `src/app/api/scales/[scaleId]/route.js`
- `src/app/api/scales/images/route.js`
- `src/app/escalas/ScalesPageClient.jsx`
- `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
