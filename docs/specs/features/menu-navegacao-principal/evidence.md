# Evidencias - menu-navegacao-principal

## Implementacao executada

- Componente de menu principal fixo: `src/components/organisms/MainBottomNav/MainBottomNav.jsx`
- Estilo do menu: `src/components/organisms/MainBottomNav/MainBottomNav.module.css`
- Integracao global do menu no layout: `src/app/layout.js`
- Ajuste global de alinhamento inferior no layout: `src/app/globals.css`
- Rota de fallback para acao `Editar perfil`: `src/app/editar-perfil/page.js`
- Estilo da rota de fallback: `src/app/editar-perfil/page.module.css`

## Comportamento entregue

- Menu inferior fixo com 5 itens na ordem da spec.
- Itens principais renderizados apenas com icones ou imagem de avatar, sem textos visiveis.
- Navegacao direta para Escalas e Componentes com estado ativo.
- Menu flutuante do `+` com atalhos para cadastro de escalas e cadastro de componentes.
- Menu flutuante do avatar com `Editar perfil` e `Sair`.
- Fechamento dos menus flutuantes somente por clique fora.
- Fallback visual do avatar por iniciais quando nao existe foto.
- Logout mock/local com redirecionamento para `/login`.
- Tema ativo aplicado ao bloco do menu, com visual inspirado no Instagram.
- Bloco do menu sem bordas visiveis e alinhado a borda inferior da viewport, sem espaco abaixo.

## Validacoes executadas

- `npm run lint`: concluido sem erros.
- `npm run build`: concluido sem erros.
- Teste manual de abertura/fechamento dos menus flutuantes.
- Teste manual de ordem dos itens e redirecionamentos principais.
