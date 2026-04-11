# Evidencias - cadastro-escalas

## Implementacao Next.js

- Rota: `src/app/cadastro-escalas/page.js`
- Estilo da rota: `src/app/cadastro-escalas/page.module.css`
- Componente de formulario da escala: `src/components/organisms/ScaleRegistrationForm/ScaleRegistrationForm.jsx`
- Estilo do formulario: `src/components/organisms/ScaleRegistrationForm/ScaleRegistrationForm.module.css`
- Integracao do calendario reutilizavel: `src/components/molecules/Calendar/Calendar.jsx`
- Route handler para busca YouTube: `src/app/api/youtube/search/route.js`
- Route handler para preview de link YouTube: `src/app/api/youtube/preview/route.js`

## Cobertura funcional esperada

- Tela de cadastro com identidade visual consistente com escalas.
- Multipla selecao de componentes.
- Definicao de funcao por componente selecionado.
- Escolha de data via calendario reutilizavel.
- Escolha de turno da escala.
- Busca YouTube com pre-visualizacao de resultados.
- Adicao de musicas na playlist da escala com deduplicacao.
- Alternativa de colar link valido de video para adicionar na playlist.
- Pre-visualizacao de conteudo a partir do link colado antes da adicao.
- Validacoes de submit com campos obrigatorios.

## Validacoes executadas

- `npm run lint`: concluido sem erros.
- `npm run build`: concluido sem erros.
- Build gerou rota estatica `/cadastro-escalas` e rotas dinamicas `/api/youtube/search` e `/api/youtube/preview`.
- Requisito de link manual + preview por link: implementado nesta entrega e validado localmente.
