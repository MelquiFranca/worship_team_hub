# Evidencias - tela-componentes

## Implementacao Next.js

- Rota: `src/app/componentes/page.js`
- Estilo da rota: `src/app/componentes/page.module.css`
- Componente principal: `src/components/organisms/ComponentsGallery/ComponentsGallery.jsx`
- Estilo do componente principal: `src/components/organisms/ComponentsGallery/ComponentsGallery.module.css`
- Fonte de dados de componentes: `src/data/scales.js` (membros normalizados sem duplicidade por `id`)

## Cobertura funcional esperada

- Tela com identidade visual consistente com a tela de escalas.
- Exibicao de todos os componentes em blocos com foto e nome.
- Grade com limite de ate 3 itens por fileira em desktop.
- Foto em formato quadrado com bordas arredondadas.
- Comportamento responsivo para mobile e tablet.
- Estado vazio e fallback de imagem tratados.

## Validacoes executadas

- `npm run lint`: concluido sem erros.
- `npm run build`: concluido sem erros.
- Build gerou rota estatica `/componentes`.
