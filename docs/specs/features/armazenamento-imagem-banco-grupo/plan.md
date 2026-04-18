# Plano Tecnico - armazenamento-imagem-banco-grupo

## Passos executados

1. Adicionar colecao/index `group_settings` no Mongo.
2. Criar rota `src/app/api/group-settings/route.js` com `GET` e `PATCH`.
3. Reaproveitar parser/serializer de imagem (`photoDataUrl`) ja usado em componentes.
4. Integrar `GroupSettingsContext` para carregar da API e salvar no banco.
5. Ajustar tela `GroupGeneralSettings` com validacao de 2MB e estado de salvamento.
6. Documentar feature.

## Riscos tratados

- Quebra de compatibilidade: fallback local mantido.
- Payload grande: limite de 2MB no frontend e backend.
- Dados invalidos: validacao de nome/funcoes/tema/foto na API.
