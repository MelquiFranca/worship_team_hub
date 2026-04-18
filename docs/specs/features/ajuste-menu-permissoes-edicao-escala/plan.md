# Plano Tecnico - ajuste-menu-permissoes-edicao-escala

## 1) Referencia da Spec

- Feature: ajuste-menu-permissoes-edicao-escala
- Documento: `features/ajuste-menu-permissoes-edicao-escala/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Executar em camadas para reduzir regressao: primeiro correcao visual isolada do menu, depois evolucao do contrato de API de escalas com validacao server-side, em seguida evolucao do formulario de cadastro/edicao para capturar as permissoes granulares e, por fim, aplicacao das regras no feed de escalas com fallback para dados legados.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Tornar grade do `MainBottomNav` dinamica por quantidade de itens exibidos. | AC-01 | Manual/UI | Diff em `MainBottomNav` |
| T-02 | Adicionar controles de permissao por componente no `ScaleRegistrationForm` e incluir no payload de submit. | AC-02 | Integracao + Manual | Diff em `ScaleRegistrationForm` |
| T-03 | Evoluir API de escalas (`POST/GET/PATCH`) para persistir/serializar IDs de permissao e validar consistencia com componentes da escala. | AC-03, AC-04 | Integracao backend | Diff em `src/app/api/scales/*` |
| T-04 | Aplicar permissoes granulares no `ScaleFeed` para edicao de playlist/imagem por componente autorizado. | AC-05, AC-06 | Manual + Integracao | Diff em `ScaleFeed` |
| T-05 | Ajustar autorizacao de leitura para `component-app` em escalas/componentes com escopo de grupo no token. | AC-07 | Integracao backend | Diff em `src/lib/api/auth.js` e `/api/components` |
| T-06 | Otimizar hidratação de permissao no feed para reutilizar dados de listagem quando presentes. | AC-05, AC-06 | Regressao manual | Diff em `ScalesPageClient` e `ScaleFeed` |
| T-07 | Validacao final com lint/build e registro documental completo. | AC-01 a AC-07 | Lint + Build | Saidas de `npm run lint` e `npm run build` |

## 4) Ordem de Execucao

1. T-01
2. T-03 e T-05
3. T-02
4. T-04
5. T-06
6. T-07

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Componente autenticado nao ser mapeado corretamente no membro da escala | Medio | Media | Manter fallback seguro (somente visualizacao) e feedback claro de bloqueio. |
| Divergencia entre validação de frontend e backend para IDs permitidos | Alto | Media | Validacao server-side obrigatoria em `POST/PATCH` e limpeza de IDs inconsistentes no fluxo de edicao. |
| Regressao de navegacao no menu inferior para outros perfis | Medio | Baixa | Grade dinamica mantendo ordem e itens existentes; validar visualmente `group-app` e `component-app`. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao (campos opcionais com fallback `[]`)
- Plano de fallback: manter permissao padrao apenas por audiencia quando campos granulares nao existirem.
- Plano de rollback: reverter commits de `MainBottomNav`, `ScaleRegistrationForm`, `ScaleFeed` e APIs de escalas.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressoes criticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-18 | Persistir permissoes granulares como listas de `componentId` (`playlistEditorComponentIds` e `imageEditorComponentIds`) no documento de escala | Simplicidade de leitura/escrita e baixo impacto em schema atual | Permite autorizacao direta por card com baixo acoplamento |
| 2026-04-18 | Validar no backend que IDs de permissao pertencem a componentes da escala | Evitar inconsistencias e bypass de permissao pelo cliente | Maior confiabilidade e seguranca da regra |
| 2026-04-18 | Tornar colunas do menu inferior dinamicas via custom property CSS | Corrigir desalinhamento de `component-app` sem duplicar layout | Layout responsivo consistente para 3/4/5 itens |
