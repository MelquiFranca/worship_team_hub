# Validacao - filtro-escalas-vigentes

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | `src/app/api/scales/route.js` | `parseScaleTimeScope` define default `current-and-future`; consulta aplica `{ date: { $gte: currentLocalIsoDate } }`. |
| AC-02 | Pass | `src/app/api/scales/route.js` | `timeScope=all` usa filtro apenas por `groupId`, sem recorte de data. |
| AC-03 | Pass | `src/app/api/scales/route.js` | Valor invalido retorna `400 BAD_REQUEST` com mensagem de valores aceitos. |
| AC-04 | Pass | `src/app/escalas/ScalesPageClient.jsx` | Estado inicial `timeScope` em `current-and-future` e request para `/api/scales` inclui query param do filtro. |
| AC-05 | Pass | `src/app/escalas/ScalesPageClient.jsx`, `src/components/organisms/ScaleFeed/ScaleFeed.jsx` | Seletor no header altera `timeScope` e dispara novo carregamento da lista. |
| AC-06 | Pass | `src/components/organisms/ScaleFeed/ScaleFeed.jsx` | Header comunica explicitamente: `Por padrao, exibindo escalas de hoje e datas futuras.` |

## Resultado final

- Status: Concluido
- Data: 2026-04-18
- Responsavel: Codex

## Pendencias e Riscos Residuais

- A referencia de "hoje" no backend depende do timezone local do servidor.
- Nao houve teste automatizado de integracao; validacao principal foi por revisao de codigo e lint.
