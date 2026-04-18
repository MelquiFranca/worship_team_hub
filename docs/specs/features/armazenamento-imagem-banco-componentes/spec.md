# Spec Funcional - armazenamento-imagem-banco-componentes

## 1) Contexto

- Data: 2026-04-18
- Autor(a): Codex
- Status: Implementado
- Stakeholders: Produto, Frontend, Backend, QA

## 2) Problema

O fluxo antigo de cadastro de componente usava apenas `photoUrl`/`photoProvided`, sem persistir o arquivo enviado no banco. Isso impedia rastreabilidade do upload e gerava dependencia de URLs externas ou placeholders.

## 3) Objetivo

Permitir upload de imagem de componente e persistir o conteudo no MongoDB, mantendo compatibilidade com `photoUrl` legado.

## 4) Escopo

- Receber imagem via `photoDataUrl` (base64) em `POST /api/components` e `PATCH /api/components/:componentId`.
- Validar tipo e tamanho antes de salvar.
- Persistir imagem em `components.photo` com metadados.
- Expor `photoDataUrl` serializado na resposta da API.
- Preservar `photoUrl` legado como fallback de leitura/escrita.
- Permitir remocao de foto em `PATCH` com `photoDataUrl: null` ou string vazia.

## 5) Nao-Escopo

- Storage externo (S3/Cloudinary/etc).
- Edicao de imagem (crop, resize, filtros).
- Suporte a multiplas fotos por componente.
- Migracao massiva automatica de fotos legadas.

## 6) Regras de negocio

| Regra | Descricao |
| --- | --- |
| R-01 | O upload deve ser enviado em `photoDataUrl` no formato `data:<mime>;base64,<payload>`. |
| R-02 | Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. |
| R-03 | Tamanho maximo aceito: `2MB`. |
| R-04 | Se houver `components.photo`, ela tem prioridade sobre `photoUrl` na serializacao. |
| R-05 | `photoUrl` continua aceito para compatibilidade retroativa. |
| R-06 | `PATCH` com `photoDataUrl: null` ou `""` remove a foto persistida. |
| R-07 | Erros de validacao retornam `400 BAD_REQUEST` com mensagem clara. |

## 7) Modelagem de dados

A foto fica embutida no documento `components`.

```json
{
  "_id": "component-id",
  "photo": {
    "contentType": "image/png",
    "data": "<Binary>",
    "size": 123456,
    "filename": "avatar.png",
    "updatedAt": "2026-04-18T20:00:00.000Z"
  },
  "photoUrl": "https://... (legado opcional)",
  "photoProvided": true
}
```

## 8) Contrato de API

### 8.1 POST /api/components

Campos novos relevantes:

```json
{
  "fullName": "Nome",
  "birthDate": "1990-01-01",
  "username": "usuario",
  "password": "senha",
  "permissionType": "group-app",
  "pushTargets": [],
  "photoDataUrl": "data:image/png;base64,iVBORw0...",
  "photoFilename": "avatar.png",
  "photoUrl": ""
}
```

Observacoes:
- `photoDataUrl` e opcional.
- Se enviado, precisa ser valido e respeitar limite/tipos.

### 8.2 PATCH /api/components/:componentId

Atualizacao/substituicao:

```json
{
  "photoDataUrl": "data:image/jpeg;base64,/9j/4AAQ...",
  "photoFilename": "nova-foto.jpg"
}
```

Remocao:

```json
{
  "photoDataUrl": null
}
```

### 8.3 Resposta (GET/POST/PATCH)

```json
{
  "item": {
    "id": "component-id",
    "photoDataUrl": "data:image/png;base64,iVBOR...",
    "photoUrl": "https://... (ou vazio)",
    "photoProvided": true
  }
}
```

Observacao:
- `photoDataUrl` tambem pode retornar o valor legado de `photoUrl` quando nao houver `components.photo`.

## 9) Criterios de aceite

| ID | Criterio |
| --- | --- |
| AC-01 | Upload valido em `photoDataUrl` salva foto no banco e retorna `photoDataUrl` na resposta. |
| AC-02 | Upload invalido (tipo/formato/tamanho) retorna `400`. |
| AC-03 | PATCH permite substituir foto existente. |
| AC-04 | PATCH com `photoDataUrl: null` remove a foto persistida. |
| AC-05 | Registros legados com apenas `photoUrl` continuam funcionando. |
| AC-06 | Frontend exibe fotos priorizando `photoDataUrl` sem quebrar telas existentes. |

## 10) Riscos

| Risco | Mitigacao |
| --- | --- |
| Payload JSON grande com base64 | Limite de 2MB e validacao no frontend/backend. |
| Divergencia entre legado e novo formato | Serializer unico com prioridade definida para `photo`. |
| Regressao de telas antigas | Fallback para `photoUrl` mantido. |

## 11) Arquivos impactados

- `src/lib/components/photo.js`
- `src/app/api/components/route.js`
- `src/app/api/components/[componentId]/route.js`
- `src/components/organisms/ComponentRegistrationForm/ComponentRegistrationForm.jsx`
- `src/app/componentes/ComponentsPageClient.jsx`
- `src/app/escalas/ScalesPageClient.jsx`
- `src/components/organisms/ScaleRegistrationForm/ScaleRegistrationForm.jsx`
