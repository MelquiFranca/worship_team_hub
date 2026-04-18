# Plano Tecnico - armazenamento-imagem-banco-componentes

## 1) Referencia

- Feature: `armazenamento-imagem-banco-componentes`
- Spec: `docs/specs/features/armazenamento-imagem-banco-componentes/spec.md`

## 2) Estrategia

Implementacao incremental em tres camadas:

1. Backend: parser/validacao/serializacao de foto em banco.
2. API de componentes: criar, atualizar, remover e ler foto persistida.
3. Frontend: enviar `photoDataUrl` e consumir `photoDataUrl` com fallback legado.

## 3) Tarefas

| ID | Tarefa | Status |
| --- | --- | --- |
| T-01 | Criar helper de foto (`parseComponentPhotoInput`/`serializeComponentPhoto`) | Concluida |
| T-02 | Integrar helper em `POST /api/components` | Concluida |
| T-03 | Integrar helper em `PATCH /api/components/:componentId` com remocao | Concluida |
| T-04 | Expor `photoDataUrl` no serializer das rotas de componentes | Concluida |
| T-05 | Ajustar formulario para enviar data URL real do arquivo | Concluida |
| T-06 | Ajustar telas consumidoras para priorizar `photoDataUrl` | Concluida |
| T-07 | Documentar feature completa (spec/plan/validation/evidence/README) | Concluida |

## 4) Ordem de execucao aplicada

1. Criacao do helper em `src/lib/components/photo.js`.
2. Adaptacao das rotas API (`POST`, `PATCH`, `GET`).
3. Adaptacao do frontend (upload + leitura).
4. Validacao via lint e revisao de diffs.

## 5) Riscos e mitigacoes

| Risco | Mitigacao aplicada |
| --- | --- |
| Base64 aumentar payload | Limite de 2MB nos dois lados. |
| Tipo de arquivo inesperado | Lista de MIME permitidos no backend e validacao no cliente. |
| Quebra de telas legadas | `photoUrl` mantido como fallback e retorno na API. |
| Remocao apagar campo errado | Uso de `$unset` especifico para `photo`. |

## 6) Rollout

- Deploy direto sem migracao obrigatoria de schema.
- Registros antigos continuam funcionais via `photoUrl`.
- Migracao legada pode ser feita depois, de forma opcional.

## 7) Testes planejados e executados

- Executado:
  - `npm run lint`
- Validacao manual recomendada (pos-deploy):
  - cadastro com upload valido
  - edicao sem trocar foto
  - edicao trocando foto
  - remocao de foto com payload explicito
