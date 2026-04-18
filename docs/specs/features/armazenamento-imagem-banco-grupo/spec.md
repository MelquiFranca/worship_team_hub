# Spec Funcional - armazenamento-imagem-banco-grupo

## Contexto

- Data: 2026-04-18
- Status: Implementado

## Problema

A tela de configuracoes gerais do grupo mantinha a foto apenas em `localStorage` do navegador, sem persistencia centralizada em banco de dados.

## Objetivo

Persistir a imagem do grupo no MongoDB, com upload via `photoDataUrl`, validacao de tipo/tamanho e fallback para `photoUrl` legado.

## Escopo

- Criar API `GET/PATCH /api/group-settings`.
- Persistir configuracoes por `groupId` em `group_settings`.
- Salvar foto em banco no subdocumento `photo` (binario + metadados).
- Expor `photoDataUrl` serializado para o frontend.
- Integrar `GroupSettingsContext` para carregar/salvar com backend.

## Nao-escopo

- Storage externo (S3/Cloudinary).
- Editor de imagem.
- Multiplas fotos por grupo.

## Regras

- Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- Limite de tamanho: `2MB`.
- `photoDataUrl` tem precedencia sobre `photoUrl`.
- Remocao de foto: `photoDataUrl: null` ou `""`.
- Nome do grupo: entre 3 e 48 caracteres.
- `availableFunctions`: ao menos 1 funcao valida.

## Criterios de aceite

- `GET /api/group-settings` retorna configuracoes persistidas do grupo.
- `PATCH /api/group-settings` salva nome/foto/funcoes/tema com validacao.
- A foto do grupo aparece em toda a app apos salvar e recarregar.
- Em indisponibilidade da API, o fallback local continua funcional para leitura inicial.
