# Validacao - armazenamento-imagem-banco-componentes

## Matriz de aceite

| Criterio | Resultado | Evidencia |
| --- | --- | --- |
| AC-01 Upload valido persiste em banco | Pass | Implementacao em `src/lib/components/photo.js` + integracao em `src/app/api/components/route.js` |
| AC-02 Upload invalido retorna 400 | Pass | Validacoes em `parseComponentPhotoInput`/`parsePhotoDataUrl` |
| AC-03 PATCH substitui foto | Pass | `updates.photo = ...` em `src/app/api/components/[componentId]/route.js` |
| AC-04 PATCH remove foto com null/vazio | Pass | `$unset.photo` em `src/app/api/components/[componentId]/route.js` |
| AC-05 Compatibilidade `photoUrl` legado | Pass | `serializeComponentPhoto` retorna fallback `photoUrl` |
| AC-06 Frontend prioriza `photoDataUrl` | Pass | Ajustes em `ComponentsPageClient`, `ScalesPageClient` e `ScaleRegistrationForm` |

## Validacao de arquivo

| Caso | Resultado esperado |
| --- | --- |
| `image/jpeg`, `image/png`, `image/webp`, `image/gif` <= 2MB | Aceitar |
| Tipo nao permitido | Rejeitar com `400` |
| Data URL malformada | Rejeitar com `400` |
| Arquivo acima de 2MB | Rejeitar com `400` |

## Validacao tecnica executada

- `npm run lint`: aprovado.

## Riscos residuais

- Nao foram adicionados testes automatizados de integracao para as novas validacoes de upload.
- Fluxo de remocao explicita de foto ainda nao esta exposto por botao dedicado no formulario.
