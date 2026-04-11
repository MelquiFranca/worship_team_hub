# Plano Tecnico - tela-componentes

## 1) Referencia da Spec

- Feature: tela-componentes
- Documento: `features/tela-componentes/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Construir a tela por camadas para garantir consistencia visual com escalas: primeiro base da pagina e layout, depois grade de componentes em ate 3 colunas, em seguida bloco de componente com foto quadrada arredondada e por fim ajustes responsivos/estado vazio.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Criar estrutura base da tela de componentes (rota, container e cabecalho) espelhando a identidade da tela de escalas | AC-01 | Manual | Screenshot da pagina base |
| T-02 | Implementar grade com limite de ate 3 itens por fileira e espacamentos consistentes | AC-01, AC-03 | Manual responsivo | Capturas desktop/tablet/mobile |
| T-03 | Implementar bloco de componente com foto quadrada arredondada e nome visivel | AC-02, AC-04 | Manual + componente | Screenshot e trecho de CSS aplicado |
| T-04 | Ajustar responsividade e tratar estado vazio/fallback de imagem sem quebrar grade | AC-05 | Manual | Evidencia de cenarios ER-01 e ER-02 |
| T-05 | Revisar consistencia visual final com tela de escalas e fechar validacao | AC-01 a AC-05 | Manual | Checklist visual preenchido |

## 4) Ordem de Execucao

1. Estruturar pagina e container principal com o mesmo contexto visual da tela de escalas (T-01).
2. Entregar grade principal com regra de ate 3 por fileira (T-02).
3. Entregar card de componente com foto quadrada arredondada e nome (T-03).
4. Refinar adaptacao responsiva e estados de erro/vazio (T-04).
5. Validar criterios e consolidar evidencias (T-05).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Divergencia visual entre tela de componentes e tela de escalas | Alto | Media | Reutilizar estilos e tokens existentes sempre que possivel e validar lado a lado. |
| Quebra de grid em telas pequenas | Medio | Media | Definir breakpoints claros e validar manualmente mobile/tablet antes do fechamento. |
| Inconsistencia de imagens (proporcao/origem) | Medio | Alta | Forcar `aspect-ratio: 1 / 1`, `object-fit: cover` e fallback para imagem ausente. |

## 6) Estrategia de Rollout

- Feature flag: Opcional
- Migracao necessaria: Nao
- Plano de fallback: manter acesso principal pela tela de escalas ate homologacao da nova tela.
- Plano de rollback: reverter somente rota/componentes da tela nova sem afetar modulos existentes.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-11 | Limitar grade a no maximo 3 colunas no desktop | Melhor leitura visual e alinhamento com requisito funcional | Evita densidade excessiva de itens |
| 2026-04-11 | Padronizar foto do componente em proporcao 1:1 com borda arredondada | Garantir uniformidade entre cards e previsibilidade visual | Melhora consistencia estetica e facilita manutencao |
