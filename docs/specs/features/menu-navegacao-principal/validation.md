# Validacao - menu-navegacao-principal

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Pass | `src/components/organisms/MainBottomNav/MainBottomNav.jsx`, `src/components/organisms/MainBottomNav/MainBottomNav.module.css` | Menu fixo inferior implementado na ordem: Escalas, Componentes, `+`, Configuracoes gerais do grupo, Avatar, com icones/imagem apenas, sem textos visiveis, sem bordas e colado a borda inferior. |
| AC-02 | Pass | `src/components/organisms/MainBottomNav/MainBottomNav.jsx` | Itens Escalas e Componentes navegam para `/escalas` e `/componentes` com estado ativo visual e `aria-current`. |
| AC-03 | Pass | `src/components/organisms/MainBottomNav/MainBottomNav.jsx` | Botao `+` abre menu flutuante com duas opcoes de cadastro e nao fecha por Escape. |
| AC-04 | Pass | `src/components/organisms/MainBottomNav/MainBottomNav.jsx` | Opcoes do menu `+` redirecionam para `/cadastro-escalas` e `/cadastro-componentes`. |
| AC-05 | Pass | `src/components/organisms/MainBottomNav/MainBottomNav.jsx` | Avatar abre menu flutuante com `Editar perfil` e `Sair` e nao fecha por Escape. |
| AC-06 | Pass | `src/components/organisms/MainBottomNav/MainBottomNav.jsx`, `src/app/editar-perfil/page.js` | `Editar perfil` aponta para rota dedicada `/editar-perfil` (fallback local funcional). |
| AC-07 | Pass | `src/components/organisms/MainBottomNav/MainBottomNav.jsx` | `Sair` dispara logout mock/local previsivel e redireciona para `/login`. |
| AC-08 | Pass | `src/components/organisms/MainBottomNav/MainBottomNav.module.css`, `src/app/globals.css` | Menu permanece acessivel em mobile/desktop, com tema ativo aplicado ao bloco do menu e sem espaco inferior externo. |
| AC-09 | Pass | `src/components/organisms/MainBottomNav/MainBottomNav.jsx`, `src/components/organisms/MainBottomNav/MainBottomNav.module.css` | Menus flutuantes sao navegaveis por teclado, com foco visivel, e o fechamento manual ocorre somente por clique fora. |

## Resultado final

- Status: Concluido
- Data: 2026-04-11
- Responsavel: Codex

## Pendencias e Riscos Residuais

- Logout ainda e mock/local (sem integracao com backend de autenticacao real).
- A rota `/editar-perfil` e um fallback local para manter navegacao previsivel enquanto a tela completa de perfil nao for expandida.
- O comportamento de fechamento por clique fora depende do ambiente de execucao tratar eventos de ponteiro com consistencia.
