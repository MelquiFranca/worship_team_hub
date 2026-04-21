# Evidências - padronizacao-headers-telas-principais

## Arquivos alterados

- `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
- `src/components/organisms/ScaleFeed/ScaleFeed.module.css`
- `src/components/organisms/ComponentsGallery/ComponentsGallery.jsx`
- `src/components/organisms/ComponentsGallery/ComponentsGallery.module.css`
- `src/app/cadastro-componentes/page.js`
- `src/app/cadastro-componentes/page.module.css`
- `src/components/organisms/GroupGeneralSettings/GroupGeneralSettings.jsx`
- `src/components/organisms/GroupGeneralSettings/GroupGeneralSettings.module.css`

## Evidências funcionais

- Header da tela `escalas` ajustado para manter apenas o campo de filtro no resumo.
- Header da tela `componentes` padronizado visualmente e com textos de resumo alinhados em tom.
- Header da tela `cadastro-componentes` padronizado visualmente e com textos de resumo alinhados em tom.
- Header da tela `configuracoes-gerais-grupo` padronizado visualmente e com textos de resumo alinhados em tom.
- Nomenclatura dos cards de resumo alinhada para `Contexto`, `Status`, `Detalhe` nas telas com resumo completo.

## Evidência técnica

- Comando executado: `npm run lint`
- Resultado: sem erros e sem warnings de ESLint.

## Checklist

- [x] Header de `escalas` sem campos `Total` e `Abertas`.
- [x] Filtro de período mantido funcional no header de `escalas`.
- [x] Tom e nomenclatura dos cards de resumo padronizados nas telas-alvo.
- [x] Lint validado.
