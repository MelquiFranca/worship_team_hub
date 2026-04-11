# Evidencias - cadastro-componentes

## Implementacao Next.js

- Rota: `src/app/cadastro-componentes/page.js`
- Estilo da rota: `src/app/cadastro-componentes/page.module.css`
- Componente de formulario: `src/components/organisms/ComponentRegistrationForm/ComponentRegistrationForm.jsx`
- Estilo do formulario: `src/components/organisms/ComponentRegistrationForm/ComponentRegistrationForm.module.css`
- Componente de calendario reutilizavel: `src/components/molecules/Calendar/Calendar.jsx`
- Estilo do calendario: `src/components/molecules/Calendar/Calendar.module.css`

## Cobertura funcional esperada

- Tela de cadastro com identidade visual consistente com escalas.
- Campos completos: foto, nome completo, data de nascimento, usuario e senha.
- Upload com pre-visualizacao de foto.
- Calendario customizado sem biblioteca externa.
- Validacoes de obrigatoriedade com feedback de erro.
- Contrato de reutilizacao do calendario para outras telas.

## Validacoes executadas

- `npm run lint`: concluido sem erros.
- `npm run build`: concluido sem erros.
- Build gerou rota estatica `/cadastro-componentes`.
