# Plano Tecnico - texto-explicativo-imagem-escala

## 1) Referencia da Spec

- Feature: texto-explicativo-imagem-escala
- Documento: `features/texto-explicativo-imagem-escala/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Expandir o contrato de `imageAttachment` para incluir `description` (texto explicativo), propagar o campo na normalizacao frontend e adicionar controles de edicao no painel de imagem. A persistencia deve continuar no mesmo endpoint e na mesma verificacao de permissao de edicao de imagem.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Atualizar parser/serializer de `imageAttachment` para aceitar e retornar `description` | AC-03, AC-04 | Integracao/Manual | Diff em `src/lib/scales/imageAttachment.js` |
| T-02 | Atualizar `ScaleFeed` para exibir/editar texto explicativo com UI acessivel e feedback | AC-01, AC-02, AC-04 | Manual | Diff em `ScaleFeed.jsx` e `ScaleFeed.module.css` |
| T-03 | Garantir que salvar texto usa o mesmo fluxo de permissao/autorizacao de imagem | AC-02, AC-03 | Manual | Teste com perfil autorizado/nao autorizado |
| T-04 | Registrar validacao final por criterio e riscos residuais | AC-01 a AC-04 | Manual | `validation.md` atualizado |

## 4) Ordem de Execucao

1. T-01: ajuste de contrato backend/frontend para `description`.
2. T-02: implementacao da interface de texto explicativo no painel de imagem.
3. T-03: validacao de permissao reaproveitando gate de imagem.
4. T-04: consolidacao das evidencias em `validation.md`.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Campo novo nao persistir para imagens legadas | Medio | Media | Manter fallback para string vazia e serializacao opcional. |
| Usuario sem permissao conseguir editar por falha de UI | Alto | Baixa | Reusar `canEditImage` no frontend e autorizacao no backend via `imageAttachment`. |
| Regressao no upload/selecao de imagem | Medio | Baixa | Nao alterar regras de arquivo; mudar apenas metadado adicional. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: manter `description` vazio e ocultar bloco de edicao se necessario.
- Plano de rollback: reverter alteracoes de `ScaleFeed` e `imageAttachment`.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-05-14 | Persistir texto em `imageAttachment.description` | Reusar o mesmo contrato e permissao da imagem | Menor impacto estrutural |
| 2026-05-14 | Salvar descricao por acao explicita de botao | Dar controle ao usuario e feedback claro | Menos chamadas de API por digito |
