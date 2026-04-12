# Plano Tecnico - expansao-admin-imagens

## 1) Referencia da Spec

- Feature: expansao-admin-imagens
- Documento: `features/expansao-admin-imagens/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Implementar em trilhas paralelas curtas para reduzir risco de regressao:

1. Evolucao do card de escalas (bloco de imagens).
2. Ajustes de login (grupo + admin).
3. Nova area admin (grupos + menu dedicado).

Cada trilha fecha com validacao local antes de integrar no layout global.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Estender dados de escala para suportar `imageAttachment` e fonte de imagens anteriores (mock) | AC-01, AC-02 | Unitario/Manual | Diff em `src/data/scales.js` |
| T-02 | Adicionar `IMAGES_VIEW` no `ScaleFeed` e botao iconico na ultima posicao do grupo esquerdo | AC-01, AC-02 | Integracao/UI | Render do card com novo botao |
| T-03 | Implementar painel de imagem com estado vazio + CTA adicionar + seletor de imagem anterior | AC-02, AC-03 | Integracao/UI | Fluxo completo no card |
| T-04 | Remover botao Facebook e bloco `Cadastre-se` do login atual | AC-04 | Visual/Regressao | `/login` sem elementos removidos |
| T-05 | Criar `AdminLoginCard` (ou variante do `LoginCard`) e rota `/admin/login` | AC-05 | Integracao | Navegacao e submit mock admin |
| T-06 | Criar dados mock de grupos (`src/data/groups.js`) com imagem, nome e status | AC-06 | Unitario/Manual | Arquivo de dados e uso em tela |
| T-07 | Implementar tela `/admin/grupos` listando todos os grupos com badge de status | AC-06 | Visual/Integracao | Render da listagem |
| T-08 | Implementar menu principal admin com `Configuracoes`, `Adicionar -> Novo grupo`, avatar | AC-07, AC-08 | Integracao/UI | Componente `AdminMainBottomNav` |
| T-09 | Aplicar requisitos de acessibilidade e responsividade em blocos novos | AC-09 | Manual a11y | Checklist de foco/tab/labels |
| T-10 | Validacao final de regressao cruzada entre visao grupo e admin | AC-08, AC-09 | Manual + build | `validation.md` preenchido |

## 4) Ordem de Execucao

1. T-01 a T-03 (bloco de imagens no card de escala).
2. T-04 e T-05 (login grupo simplificado + login admin separado).
3. T-06 e T-07 (dados e tela de grupos admin).
4. T-08 (menu admin principal).
5. T-09 e T-10 (a11y, responsivo e regressao final).

## 5) Mudancas por arquivo (mapa inicial)

- `src/data/scales.js`:
  - incluir `imageAttachment` por escala.
  - incluir mock de historico de imagens reutilizaveis (direto ou derivado).
- `src/components/organisms/ScaleFeed/ScaleFeed.jsx`:
  - adicionar constante `IMAGES_VIEW`.
  - adicionar botao iconico de imagem na esquerda (ultima posicao).
  - criar `ScaleImagePanel` com estados: sem imagem, com imagem, escolher anterior.
- `src/components/organisms/ScaleFeed/ScaleFeed.module.css`:
  - estilos do painel de imagem, preview, grid/lista de historico, CTA.
- `src/components/organisms/LoginCard/LoginCard.jsx`:
  - remover bloco Facebook e footer `Cadastre-se`.
- `src/components/organisms/LoginCard/LoginCard.module.css`:
  - limpar estilos nao usados de social/cadastro.
- `src/app/admin/login/page.js` (novo):
  - rota de login admin.
- `src/components/organisms/AdminLoginCard/AdminLoginCard.jsx` (novo) e CSS:
  - UI de login admin (base da tela atual com copy/contexto admin).
- `src/data/groups.js` (novo):
  - lista mock de grupos com `id`, `name`, `photo`, `status`.
- `src/app/admin/grupos/page.js` e `page.module.css` (novos):
  - listagem de grupos admin.
- `src/components/organisms/AdminMainBottomNav/AdminMainBottomNav.jsx` e CSS (novos):
  - menu admin com acoes requisitadas.
- `src/app/layout.js`:
  - decidir render condicional de nav por rota (`MainBottomNav` vs `AdminMainBottomNav`).

## 6) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Conflito entre menu atual e menu admin no mesmo layout global | Alto | Media | Render condicional por prefixo de rota (`/admin`). |
| Acoplamento excessivo no `ScaleFeed` apos nova view de imagem | Medio | Media | Extrair painel para subcomponente `ScaleImagePanel`. |
| Reuso de login sem isolamento de estado | Alto | Media | Chaves de sessionStorage separadas para grupo e admin. |
| Estado vazio de imagem confuso para usuario | Medio | Media | Priorizar CTA claro e lista de imagens anteriores com preview. |
| Regressao visual no mobile do card/menu | Alto | Media | Validar breakpoints 320px, 375px, 768px. |

## 7) Estrategia de Rollout

- Feature flag: Opcional (recomendado `ENABLE_ADMIN_VIEW` e `ENABLE_SCALE_IMAGE_BLOCK`).
- Migracao necessaria: Nao.
- Plano de fallback:
  - esconder menu admin e rotas `/admin/*` por flag.
  - manter card de escalas sem view de imagem por flag.
- Plano de rollback:
  - reverter arquivos novos de admin.
  - reverter bloco de imagem em `ScaleFeed`.

## 8) Estrategia de Testes

- Unitarios (dados): shape de `groups` e `imageAttachment` por escala.
- Integracao:
  - alternancia de views do card com `IMAGES_VIEW`.
  - fluxo de escolha de imagem anterior.
  - login grupo e login admin em rotas separadas.
  - menu admin com popover `Adicionar -> Novo grupo`.
- Manuais:
  - acessibilidade (tab, foco, labels).
  - responsividade (card de escala e nav admin).
  - regressao de navegacao entre `/escalas`, `/login`, `/admin/login`, `/admin/grupos`.

## 9) Criterios de Pronto por Incremento

- [ ] Codigo implementado
- [ ] Testes do incremento executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 10) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-12 | Isolar visao admin em `/admin/*` | Evitar ambiguidade de navegacao e permissao | Menor risco de regressao na visao atual |
| 2026-04-12 | Limitar a 1 imagem por escala na fase 1 | Simplificar regra de negocio e UI | Entrega mais rapida e validavel |
| 2026-04-12 | Reuso visual do login via componente dedicado admin | Consistencia de UX com isolamento de fluxo | Facil manutencao futura |
