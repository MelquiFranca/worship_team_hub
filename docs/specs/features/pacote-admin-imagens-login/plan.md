# Plano Tecnico - pacote-admin-imagens-login

## 1) Referencia da Spec

- Feature: pacote-admin-imagens-login
- Documento: `features/pacote-admin-imagens-login/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Executar em 4 blocos incrementais para reduzir regressao:
1. Escalas (bloco de imagens),
2. Login (remocoes e rota admin),
3. Grupos admin,
4. Navegacao admin separada.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Evoluir contrato de dados de escala para suportar `image` e catalogo de imagens historicas (derivado de escalas) | AC-01, AC-04 | Unitario/Manual | Diff em `src/data/scales.js` |
| T-02 | Adicionar view `Imagens` no `ScaleFeed` e novo botao iconico no grupo esquerdo (ultima posicao) | AC-01, AC-02 | Integracao/Visual | Render dos botoes e view ativa |
| T-03 | Implementar estado vazio do bloco de imagens com `Adicionar imagem` e `Escolher imagem anterior` | AC-02, AC-03, AC-04 | Integracao/Manual | Fluxo funcional sem imagem vinculada |
| T-04 | Garantir acessibilidade e isolamento de estado entre cards na nova view `Imagens` | AC-04, AC-10 | Integracao + a11y manual | Checklist foco/teclado |
| T-05 | Ajustar login principal removendo Facebook e `Cadastre-se` | AC-05, AC-10 | Visual/Manual | Revisao em `/login` |
| T-06 | Criar rota `/admin/login` reutilizando base da tela de login com variacao de contexto | AC-06, AC-10 | Navegacao/Manual | Render da rota admin |
| T-07 | Criar tela `/admin/grupos` com mock de grupos (imagem, nome, status) | AC-07 | Visual/Manual | Screenshot/lista renderizada |
| T-08 | Criar menu principal da visao admin com `Configuracoes`, `Adicionar` -> `Novo grupo`, avatar | AC-08, AC-09, AC-10 | Integracao/Manual | Menu admin funcional |
| T-09 | Ajustar `layout` para alternar menu comum e menu admin por prefixo de rota | AC-09, AC-10 | Integracao | Sem sobreposicao de menus |
| T-10 | Consolidar validacao final e preencher `validation.md` e `evidence.md` | AC-01 a AC-10 | Manual | Documentos atualizados |

## 4) Ordem de Execucao

1. T-01 a T-04 (escala/imagens).
2. T-05 e T-06 (login comum e admin).
3. T-07 (grupos admin).
4. T-08 e T-09 (menu admin e isolamento de navegacao).
5. T-10 (fechamento documental).

## 5) Arquivos-alvo previstos

- Escalas/imagens:
  - `src/components/organisms/ScaleFeed/ScaleFeed.jsx`
  - `src/components/organisms/ScaleFeed/ScaleFeed.module.css`
  - `src/data/scales.js`
- Login:
  - `src/components/organisms/LoginCard/LoginCard.jsx`
  - `src/components/organisms/LoginCard/LoginCard.module.css`
  - `src/app/login/page.js`
  - `src/app/admin/login/page.js` (novo)
  - `src/app/admin/login/page.module.css` (novo, se necessario)
- Grupos admin:
  - `src/data/groups.js` (novo)
  - `src/app/admin/grupos/page.js` (novo)
  - `src/app/admin/grupos/page.module.css` (novo)
- Menu admin:
  - `src/components/organisms/AdminMainNav/AdminMainNav.jsx` (novo)
  - `src/components/organisms/AdminMainNav/AdminMainNav.module.css` (novo)
  - `src/app/layout.js`
  - `src/components/organisms/MainBottomNav/MainBottomNav.jsx` (ajuste de condicoes)

## 6) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| View de imagens conflitar com views atuais do card | Alto | Media | Isolar enum de views e validar estado por card com `scaleId`. |
| Complexidade de escolha de imagem anterior crescer cedo | Medio | Media | Entregar versao simples com seletor/lista de miniaturas sem upload real. |
| Duplicacao de logica entre login comum e admin | Medio | Alta | Parametrizar `LoginCard` por `mode` (`group`/`admin`). |
| Menu admin e menu comum renderizando juntos | Alto | Media | Separar render por prefixo de rota (`/admin`). |
| Falta de clareza visual de status de grupo | Medio | Baixa | Definir badge explicita `Ativo/Inativo` com contraste adequado. |

## 7) Estrategia de Rollout

- Feature flag: Opcional para bloco de imagens (`ENABLE_SCALE_IMAGE_BLOCK`) e admin (`ENABLE_ADMIN_AREA`).
- Migracao necessaria: Nao.
- Fallback: ocultar novos blocos por flag mantendo fluxo atual.
- Rollback: reverter novos arquivos admin e ajustes no `ScaleFeed`.

## 8) Criterios de Pronto por Incremento

- [ ] Implementacao concluida do incremento
- [ ] Testes definidos executados
- [ ] Sem regressao visual critica
- [ ] Evidencias registradas

## 9) Validacao recomendada

- `npm run lint`
- `npm run build`
- Checklist manual:
  - `/escalas` (view imagem com e sem vinculacao)
  - `/login` (sem Facebook e sem Cadastre-se)
  - `/admin/login`
  - `/admin/grupos`
  - menu admin em rotas `/admin/*`

## 10) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-12 | Reutilizar `LoginCard` com variacao por modo para login admin | Evitar duplicacao e manter consistencia visual | Menor custo de manutencao |
| 2026-04-12 | Limitar bloco de imagens a 1 imagem por escala nesta fase | Entrega incremental com baixa complexidade | Evolucao futura facilitada |
| 2026-04-12 | Criar menu admin dedicado separado do menu comum | Evitar conflito de navegacao entre contextos | Melhor previsibilidade de UX |
