# Evidencias - evolucao-tela-escalas

## Implementacao Next.js

- Componente atualizado: `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
- Estilo atualizado: `src/components/organisms/ScaleFeed/ScaleFeed.module.css`
- Rota consumidora: `src/app/escalas/page.js`
- Fonte de dados de escalas: `src/data/scales.js`

## Cobertura funcional implementada

- Card de escala com controle explicito de expandir/recolher por item.
- Estado de expansao independente por card e preservado durante interacoes locais da tela.
- Visao compacta exibindo apenas cabecalho com data e turno.
- Visao expandida exibindo conteudo completo (componentes/playlist) e rodape de acoes.
- Botao `Notificar` adicionado imediatamente a esquerda de `Editar escala`.
- Feedback local de notificacao por card sem interferir nos demais.
- Atributos de acessibilidade (`aria-expanded`, `aria-controls`, labels) e foco visivel.
- Ajustes responsivos para desktop e mobile sem scroll horizontal indevido.

## Validacoes executadas

- `npm run lint`: concluido sem erros.
- `npm run build`: concluido sem erros.
- Validacao manual local da ordem de acoes no rodape (`Notificar` antes de `Editar escala`).
- Validacao manual local de independencia de expansao entre cards.
