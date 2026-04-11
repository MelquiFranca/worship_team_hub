# Evidencias - configuracoes-gerais-grupo

## Implementacao Next.js

- Rota da tela: `src/app/configuracoes-gerais-grupo/page.js`
- Estilo da rota: `src/app/configuracoes-gerais-grupo/page.module.css`
- Componente principal da tela: `src/components/organisms/GroupGeneralSettings/GroupGeneralSettings.jsx`
- Estilo do componente: `src/components/organisms/GroupGeneralSettings/GroupGeneralSettings.module.css`
- Fonte unica de verdade das configuracoes: `src/context/GroupSettingsContext.jsx`
- Tokens e mapeamento de tema: `src/theme/groupTheme.js`
- Lista compartilhada de funcoes: `src/data/groupFunctions.js`
- Consumo de identidade na home: `src/app/page.js`
- Consumo global de tokens/fallback: `src/app/globals.css`

## Cobertura funcional implementada

- Tela de configuracoes gerais com identidade visual consistente com as telas principais.
- Edicao do nome do grupo com validacao e feedback.
- Upload de foto com validacao de formato + presets + fallback visual.
- Selecao/remocao de funcoes disponiveis do grupo.
- Seletor de tema com aplicacao imediata sem reload.
- Publicacao de tokens globais para consumidores (`--group-*` e `--app-*`).
- Propagacao de tema para escalas, componentes e telas de cadastro com fallback seguro.
- Reuso das funcoes configuradas no `select` de funcao da tela `cadastro-escalas`.

## Validacoes executadas

- `npm run lint`: concluido sem erros.
- `npm run build`: concluido sem erros.
- Build gerou a rota estatica `/configuracoes-gerais-grupo`.
- Validacao manual de fallback: tema invalido/dado ausente aplica tema padrao seguro.
