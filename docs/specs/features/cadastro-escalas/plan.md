# Plano Tecnico - cadastro-escalas

## 1) Referencia da Spec

- Feature: cadastro-escalas
- Documento: `features/cadastro-escalas/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Executar em trilhas paralelas controladas: (1) base visual e formulario da escala, (2) selecao multipla e atribuicao de funcoes, (3) integracao de calendario reutilizavel, (4) busca YouTube com pre-visualizacao e montagem da playlist, (5) alternativa de colagem de link valido com pre-visualizacao, finalizando com validacoes de submit e robustez de erros.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Criar rota da tela de cadastro de escalas com estrutura base | AC-01 | Manual | Arquivo da rota + screenshot inicial |
| T-02 | Aplicar identidade visual no padrao da tela de escalas | AC-01 | Manual visual | Comparativo visual |
| T-03 | Implementar seletor multiplo de componentes com estado controlado | AC-02 | Integracao | Testes de selecao/desselecao |
| T-04 | Implementar atribuicao de funcao por componente selecionado | AC-03 | Integracao | Testes de campos dinamicos |
| T-05 | Integrar componente `Calendar` reutilizavel para campo de data | AC-04 | Componente + integracao | Reuso do calendario documentado |
| T-06 | Implementar selecao de turno (manha/tarde/noite ou regra definida) | AC-05 | Integracao + manual | Evidencia de selecao valida |
| T-07 | Implementar route handler server-side para busca YouTube e adaptador de resposta | AC-06 | Integracao | Teste de API route + mock de erro |
| T-08 | Implementar UI de busca/pre-visualizacao e adicao na playlist com deduplicacao | AC-07, AC-08 | Integracao + manual | Evidencia de add/remove/duplicata |
| T-09 | Implementar fluxo alternativo de colar link valido, validar URL e exibir pre-visualizacao antes de adicionar na playlist | AC-10, AC-11 | Integracao + manual | Evidencia de parser/preview por link |
| T-10 | Implementar validacoes finais de submit (data, turno, componentes e funcoes) e regras de erro para busca/link | AC-09 | Integracao | Testes de bloqueio e sucesso |
| T-11 | Executar lint/build e consolidar validacao final | AC-01 a AC-13 | Manual + CI local | `validation.md` atualizado |
| T-12 | Ajustar grid de componentes para 3 colunas no desktop na tela de cadastro de escalas | AC-12 | Manual visual | Diff em `ScaleRegistrationForm.module.css` e validacao em desktop/mobile |
| T-13 | Aplicar tooltip com nome completo em todos os cards de componentes | AC-13 | Manual visual | Diff em `ScaleRegistrationForm.jsx` com atributo `title` no card |

## 4) Ordem de Execucao

1. Montar pagina e identidade visual (T-01, T-02).
2. Entregar bloco de componentes selecionados e funcoes (T-03, T-04).
3. Integrar calendario e turno (T-05, T-06).
4. Construir busca YouTube no backend route e UI de playlist (T-07, T-08).
5. Entregar alternativa de link manual com pre-visualizacao (T-09).
6. Fechar validacoes de submit e consolidar evidencias (T-10, T-11, T-12, T-13).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Complexidade da gestao de estado (multiselecao + funcoes + playlist) | Alto | Media | Estruturar estado por slices e criar funcoes utilitarias puras testaveis. |
| Exposicao de chave da API do YouTube no cliente | Alto | Media | Encapsular busca em route handler server-side com variavel de ambiente. |
| Limites/quota da API do YouTube impactarem UX | Medio | Media | Adotar debounce, cache curto e mensagens claras de erro/limite. |
| Validacao incorreta de link colado gerar preview inconsistente | Medio | Media | Implementar parser de URL suportada + fallback de preview e mensagens de erro claras. |
| Regressao visual frente ao padrao da tela de escalas | Medio | Media | Revisao visual comparativa por incremento. |

## 6) Estrategia de Rollout

- Feature flag: Recomendado
- Migracao necessaria: Nao
- Plano de fallback: manter fluxo atual de cadastro de escalas ate homologacao.
- Plano de rollback: reverter rota nova e route handler de busca sem afetar feed existente.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-11 | Reaproveitar calendario customizado entre cadastros | Evitar duplicacao e manter consistencia de UX | Reduz custo de manutencao |
| 2026-04-11 | Buscar YouTube via route handler interno | Proteger credenciais e padronizar resposta | Mais seguranca e controle de erros |
