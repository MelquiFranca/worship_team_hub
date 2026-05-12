# Validacao - aumento-limite-upload-imagem-escala

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | `tests/unit/scale-image-attachment.test.mjs` (`aceita payload de imagem com exatamente 5 MB`) | Parser backend aceita payload no limite. |
| AC-02 | Pass | `tests/unit/scale-image-attachment.test.mjs` (`rejeita payload de imagem acima de 5 MB`) | Parser backend retorna erro com limite correto. |
| AC-03 | Pass | `src/components/organisms/ScaleFeed/ScaleFeed.jsx` | Validacao client-side e mensagem de feedback atualizadas para 5 MB. |
| AC-04 | Pass | `src/lib/scales/imageAttachment.js` e `src/components/organisms/ScaleFeed/ScaleFeed.jsx` | Constantes e mensagens alinhadas para 5 MB em client/server. |

## Resultado final

- Status: Aprovado
- Data: 2026-05-12
- Responsavel: Codex (GPT-5)

## Pendencias e Riscos Residuais

- Sem pendencias bloqueantes para esta alteracao.
- Risco residual: arquivos maiores aumentam payload de request; monitorar performance/percepcao em redes lentas.
