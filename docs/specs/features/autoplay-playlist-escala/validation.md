# Validacao - autoplay-playlist-escala

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | Ajuste em `src/components/organisms/ScaleFeed/ScaleFeed.jsx` na geracao do embed com fila automatica. | Com autoplay ativo, o embed recebe sequencia de IDs YouTube da playlist atual. |
| AC-02 | Pass | Estado `autoPlayEnabled` e toggle no `PlaylistPanel` em `ScaleFeed.jsx`. | Usuario controla liga/desliga da execucao automatica por card. |
| AC-03 | Pass | Botoes `Anterior`, `Proximo` e dots mantidos no mesmo componente. | Navegacao manual segue disponivel em ambos os estados do toggle. |
| AC-04 | Pass | Validacao de ID YouTube (11 chars) e fila baseada em URL no `ScaleFeed.jsx`. | Reduz inclusao de IDs invalidos na fila automatica. |
| AC-05 | Pass | Atributo `allow` do `iframe` inclui `compute-pressure` em `ScaleFeed.jsx`. | Mitiga warning de policy por falta de delegacao no iframe. |

## Resultado final

- Status: Aprovado
- Data: 2026-04-20
- Responsavel: Codex

## Pendencias e Riscos Residuais

- Alguns navegadores podem continuar bloqueando autoplay por politica de gesto do usuario.
- Videos indisponiveis por restricao/regiao/remocao no YouTube ainda podem falhar mesmo com ID valido.
