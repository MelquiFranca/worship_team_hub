# Plano Tecnico - aumento-limite-upload-imagem-escala

## 1) Referencia da Spec

- Feature: aumento-limite-upload-imagem-escala
- Documento: `features/aumento-limite-upload-imagem-escala/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Alterar o limite de upload de imagem da escala para 5 MB em backend e frontend, mantendo mensagens alinhadas. Em seguida, adicionar testes unitarios no backend para assegurar regressao zero na validacao do limite.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Atualizar constante e mensagem de validacao de limite em `src/lib/scales/imageAttachment.js` para 5 MB. | AC-01, AC-02, AC-04 | Unitario | Diff do arquivo + teste unitario novo |
| T-02 | Atualizar constante e mensagem de bloqueio de upload em `src/components/organisms/ScaleFeed/ScaleFeed.jsx` para 5 MB. | AC-03, AC-04 | Manual/UI | Diff do arquivo |
| T-03 | Criar testes unitarios cobrindo aceite em 5 MB e rejeicao acima de 5 MB no parser de imagem. | AC-01, AC-02 | Unitario | `npm run test:unit -- tests/unit/scale-image-attachment.test.mjs` |

## 4) Ordem de Execucao

1. Implementar T-01 (backend).
2. Implementar T-02 (frontend).
3. Implementar T-03 (testes) e executar suite unit.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Divergencia entre limite do frontend e backend | Medio | Media | Atualizar ambos os pontos na mesma entrega e validar por revisao cruzada. |
| Payload maior gerar erro de persistencia em casos extremos | Medio | Baixa | Manter limite conservador (5 MB) e validar rejeicao acima do teto. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: reverter limite para 2 MB mantendo validacao atual.
- Plano de rollback: rollback dos commits da feature.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regresses criticas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-05-12 | Definir limite de imagem da escala em 5 MB | Reduzir falhas de upload de imagens comuns sem crescimento excessivo de payload | Melhor UX no upload e validacao consistente client/server |
