# Validacao - evolucao-tela-escalas

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | `src/components/organisms/ScaleFeed/ScaleFeed.jsx` | Cada card possui controle explicito de expandir/recolher com estado independente por `scale.id` (fallback seguro quando id nao existir). |
| AC-02 | Pass | `src/components/organisms/ScaleFeed/ScaleFeed.jsx`, `src/components/organisms/ScaleFeed/ScaleFeed.module.css` | Na visao compacta, o card exibe somente o cabecalho (data/turno) e o botao de expansao. |
| AC-03 | Pass | `src/components/organisms/ScaleFeed/ScaleFeed.jsx`, `src/components/organisms/ScaleFeed/ScaleFeed.module.css` | Na visao expandida, o card mostra conteudo completo e rodape com `Notificar` a esquerda de `Editar escala`. |
| AC-04 | Pass | `src/components/organisms/ScaleFeed/ScaleFeed.jsx` | `Notificar` dispara feedback local por card sem quebrar estado de expansao nem outras interacoes. |
| AC-05 | Pass | `src/components/organisms/ScaleFeed/ScaleFeed.jsx`, `src/components/organisms/ScaleFeed/ScaleFeed.module.css` | Controle de expansao com `aria-expanded`/`aria-controls`, botoes acessiveis e foco visivel por teclado. |
| AC-06 | Pass | `src/components/organisms/ScaleFeed/ScaleFeed.module.css` | Layout permanece legivel em desktop/mobile com reorganizacao dos controles no breakpoint mobile. |
| AC-07 | Pass | `src/components/organisms/ScaleFeed/ScaleFeed.jsx` | Expandir/recolher um card nao altera o estado dos demais cards da lista. |
| AC-08 | Pass | `src/components/organisms/ScaleFeed/ScaleFeed.jsx` | Estado visual dos cards se preserva em re-renderes locais por mapeamento estavel de estado no componente pai. |

## Resultado final

- Status: Concluido
- Data: 2026-04-11
- Responsavel: Codex

## Pendencias e Riscos Residuais

- A acao `Notificar` permanece local (feedback em tela), sem integracao backend nesta entrega.
- Persistencia do estado expandido apos recarregar pagina continua fora do escopo.
