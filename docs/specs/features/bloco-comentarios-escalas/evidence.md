# Evidencias - bloco-comentarios-escalas

## Implementacao Next.js

- Componente principal a evoluir: `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
- Estilos principais a evoluir: `src/components/organisms/ScaleFeed/ScaleFeed.module.css`
- Fonte de dados da escala/mensagens: `src/data/scales.js`

## Cobertura funcional esperada

- Botao iconico de comentarios no rodape esquerdo do card.
- Chat de texto estilo WhatsApp por escala.
- Estrutura de mensagem extensivel para tipos futuros.
- Acoes do card representadas por icones com acessibilidade mantida.

## Validacoes executadas

- `npm run lint`: concluido sem erros.
- `npm run build`: concluido sem erros.
- Build gerou rota estatica `/escalas` com o novo fluxo de comentarios e botoes iconicos.
