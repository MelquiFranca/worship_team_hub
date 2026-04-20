# Plano Tecnico - persistencia-imagens-escalas-banco

## 1) Resumo

- Feature: `persistencia-imagens-escalas-banco`
- Spec: `docs/specs/features/persistencia-imagens-escalas-banco/spec.md`
- Objetivo tecnico: persistir imagem da escala em backend e habilitar biblioteca de reuso no frontend.

## 2) Tarefas

| ID | Tarefa | Criterios cobertos | Tipo de teste | Status |
| --- | --- | --- | --- | --- |
| T-01 | Criar helper de parse/serializacao de `imageAttachment` para escala | AC-01, AC-05 | Unitario leve/revisao tecnica | Concluida |
| T-02 | Integrar `imageAttachment` em `POST/GET /api/scales` | AC-01 | Integracao manual | Concluida |
| T-03 | Integrar `imageAttachment` em `PATCH /api/scales/:scaleId` + permissao `component-app` | AC-02 | Integracao manual | Concluida |
| T-04 | Criar `GET /api/scales/images` para biblioteca reutilizavel | AC-03 | Integracao manual | Concluida |
| T-05 | Atualizar frontend para salvar/remover/reutilizar imagem via API | AC-04 | Manual guiado | Concluida |
| T-06 | Atualizar documentacao principal + spec da feature | AC-01..AC-05 | Revisao documental | Concluida |

## 3) Ordem de execucao

1. Backend de validacao/serializacao (T-01).
2. Rotas principais de escala (T-02, T-03).
3. Rota de biblioteca global por grupo (T-04).
4. Integracao UI para persistencia e reuso (T-05).
5. Documentacao final (T-06).

## 4) Riscos e mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Payload base64 grande degradar performance | Alto | Media | Limite de 2MB e validacao backend/frontend. |
| `component-app` editar imagem sem permissao | Alto | Media | Reuso de `imageEditorComponentIds` no backend. |
| Biblioteca nao refletir imagens novas imediatamente | Medio | Media | Atualizar estado local apos persistencia no card. |

## 5) Rollback

- Reverter arquivos alterados da feature.
- Desabilitar chamada de `GET /api/scales/images` no frontend.
- Manter funcionamento das escalas sem bloco de reutilizacao persistida.
