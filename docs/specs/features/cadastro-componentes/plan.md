# Plano Tecnico - cadastro-componentes

## 1) Referencia da Spec

- Feature: cadastro-componentes
- Documento: `features/cadastro-componentes/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Implementar em camadas: primeiro estrutura visual da pagina alinhada a tela de escalas, depois formulario e upload de foto, em seguida componente de calendario sem biblioteca externa com foco em reutilizacao, finalizando com validacoes e fluxo de submit.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Criar rota da tela de cadastro de componentes com estrutura base da pagina | AC-01 | Manual | Arquivo da rota + screenshot |
| T-02 | Aplicar identidade visual alinhada a tela de escalas (container, cards, botoes, estados) | AC-01 | Manual visual | Comparativo visual entre telas |
| T-03 | Implementar formulario base com campos obrigatorios (nome, usuario, senha, data, foto) | AC-02 | Integracao | Render do formulario |
| T-04 | Implementar upload de foto com pre-visualizacao local e tratamento de arquivo invalido | AC-03 | Integracao + manual | Evidencia de preview e mensagens de erro |
| T-05 | Implementar `Calendar` reutilizavel sem bibliotecas externas (navegacao mes/ano e selecao de data) | AC-04, AC-05 | Componente + integracao | Testes e uso em formulario |
| T-06 | Implementar validacoes de obrigatoriedade e mensagens por campo | AC-06 | Integracao | Testes de submit invalido/valido |
| T-07 | Implementar comportamento do campo senha (mascarado + toggle opcional) | AC-07 | Componente + manual | Evidencia de interacao |
| T-08 | Garantir contrato de reutilizacao do calendario e preparar integracao com cadastro de escalas | AC-05 | Revisao tecnica + integracao | Uso do mesmo componente na tela de escalas |
| T-09 | Executar lint/build e consolidar validacao final | AC-01 a AC-07 | Manual + CI local | `validation.md` atualizado |

## 4) Ordem de Execucao

1. Estruturar pagina e identidade visual (T-01, T-02).
2. Implementar formulario e upload de foto (T-03, T-04).
3. Implementar calendario reutilizavel sem biblioteca externa (T-05).
4. Integrar validacoes e campos sensiveis (T-06, T-07).
5. Reusar calendario em outra tela e fechar validacao (T-08, T-09).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Complexidade do calendario sem biblioteca externa | Alto | Media | Quebrar em subcomponentes (header, grid de dias, controles) e cobrir com testes unitarios. |
| Regressao visual em relacao a tela de escalas | Medio | Media | Validacao visual comparativa por incremento. |
| Problemas de memoria com preview de imagem | Medio | Baixa | Revogar object URLs no unmount/troca de arquivo. |
| Validacoes insuficientes em campos sensiveis | Alto | Media | Definir schema minimo e testes de integracao por cenario de erro. |

## 6) Estrategia de Rollout

- Feature flag: Opcional
- Migracao necessaria: Nao
- Plano de fallback: manter processo atual de cadastro ate homologacao.
- Plano de rollback: reverter rota e componentes de cadastro sem impacto em escalas.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-11 | Criar calendario proprietario reutilizavel | Atender restricao de nao usar biblioteca externa | Maior controle e manutencao centralizada |
| 2026-04-11 | Centralizar estilos de formulario no padrao da tela de escalas | Garantir consistencia visual entre fluxos | Reduz divergencia de UI entre modulos |
