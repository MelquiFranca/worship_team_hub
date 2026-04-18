# Evidencias - filtro-escalas-vigentes

## Implementacao Next.js

- Endpoint atualizado: `src/app/api/scales/route.js`
- Cliente de escalas atualizado: `src/app/escalas/ScalesPageClient.jsx`
- Feed atualizado: `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
- Estilo do feed atualizado: `src/components/organisms/ScaleFeed/ScaleFeed.module.css`

## Cobertura funcional implementada

- Filtro temporal no backend com parametro `timeScope`.
- Default do backend em `current-and-future` (somente hoje e futuras).
- Opcao de consulta completa via `timeScope=all`.
- Validacao de parametro invalido com erro `400 BAD_REQUEST`.
- Seletor de filtro no header da tela de escalas.
- Estado inicial de UI em `Hoje e futuras`.
- Mensagem no header indicando explicitamente o comportamento padrao.
- Foco visivel no seletor para navegacao por teclado.

## Validacoes executadas

- `npm run lint`
- Revisao manual do fluxo de filtro em frontend/backend.

## Observacoes

- O endpoint agora devolve `filters.timeScope` e `filters.currentLocalIsoDate` para apoio de diagnostico.
