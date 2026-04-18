# Evidencias - armazenamento-imagem-banco-componentes

## Resumo da entrega

A feature foi implementada para armazenar fotos de componentes no MongoDB (campo `components.photo`), com serializacao para `photoDataUrl` e fallback legado por `photoUrl`.

## Evidencias de codigo

- Helper de foto:
  - `src/lib/components/photo.js`
- API componentes:
  - `src/app/api/components/route.js`
  - `src/app/api/components/[componentId]/route.js`
- Frontend (upload e consumo):
  - `src/components/organisms/ComponentRegistrationForm/ComponentRegistrationForm.jsx`
  - `src/app/componentes/ComponentsPageClient.jsx`
  - `src/app/escalas/ScalesPageClient.jsx`
  - `src/components/organisms/ScaleRegistrationForm/ScaleRegistrationForm.jsx`

## Evidencia de validacao

- Comando executado:
  - `npm run lint`
- Resultado:
  - Sem erros de lint.

## Evidencias funcionais esperadas (checagem manual)

1. Cadastrar componente com foto: imagem aparece na galeria/listas apos salvar.
2. Editar componente sem trocar foto: imagem atual permanece.
3. Editar componente com nova foto: imagem e substituida.
4. Componente legado com `photoUrl`: imagem continua sendo exibida.
