# Spec Funcional - aumento-limite-upload-imagem-escala

## 1) Contexto

- Data: 2026-05-12
- Autor(a): Codex (GPT-5)
- Status: Implemented
- Stakeholders: Produto, Lideres de grupo, Time de frontend/backend

## 2) Problema

O fluxo de upload de imagem da escala bloqueia arquivos acima de 2 MB, gerando falha para imagens comuns de celular e aumentando friccao operacional no cadastro/edicao de escalas.

## 3) Objetivo

Aumentar o limite de upload da imagem da escala para 5 MB, mantendo consistencia entre validacao client-side e server-side, com feedback claro ao usuario.

## 4) Escopo

- Atualizar o limite maximo aceito de imagem da escala de 2 MB para 5 MB no backend.
- Atualizar o limite maximo aceito de imagem da escala de 2 MB para 5 MB no frontend.
- Atualizar mensagens de erro exibidas ao usuario para refletir o novo limite.
- Cobrir a regra com teste unitario da validacao server-side.

## 5) Nao-Escopo

- Alteracao de formatos de imagem aceitos.
- Compressao automatica de imagem no cliente.
- Migracao para storage externo (S3/Cloudinary).

## 6) Usuarios e Cenarios

- Usuario-alvo: lideres e componentes autorizados para editar imagem da escala.
- Cenarios principais:
  - Usuario faz upload de imagem com tamanho ate 5 MB e o sistema aceita.
  - Usuario faz upload de imagem acima de 5 MB e o sistema bloqueia com mensagem clara.

## 7) Criterios de Aceite (testaveis)

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | O backend aceita `imageAttachment` em data URL base64 com payload binario de ate 5 MB. | Teste unitario de `parseScaleImageAttachmentInput` com arquivo de 5 MB. | Alta |
| AC-02 | O backend rejeita `imageAttachment` com payload acima de 5 MB e retorna mensagem de limite de 5 MB. | Teste unitario de `parseScaleImageAttachmentInput` com arquivo maior que 5 MB. | Alta |
| AC-03 | O frontend bloqueia upload acima de 5 MB e exibe feedback com limite de 5 MB. | Revisao de codigo no `ScaleFeed` + validacao manual. | Alta |
| AC-04 | Frontend e backend usam o mesmo valor de limite (5 MB) e nao ficam inconsistentes na UX. | Revisao de constantes e mensagens em ambos os lados. | Media |

## 8) Requisitos Nao Funcionais

- Performance: sem impacto relevante; validacao permanece O(1) por arquivo no client/server.
- Seguranca: manter whitelist de MIME e validacao de data URL no backend.
- Acessibilidade: mensagens de erro continuam textuais e legiveis na interface.
- Observabilidade: erros seguem retornando por fluxo padrao de API (`BAD_REQUEST`).

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Upload acima de 5 MB no frontend | Bloquear envio e exibir `A imagem da escala excede o limite de 5 MB.` |
| ER-02 | Payload acima de 5 MB enviado diretamente para API | Retornar `400` com `A imagem da escala excede o limite de 5 MB.` |

## 10) Dependencias e Restricoes

- Dependencias: `src/lib/scales/imageAttachment.js`, `src/components/organisms/ScaleFeed/ScaleFeed.jsx`.
- Restricoes: manter compatibilidade com fluxo atual baseado em data URL/base64.

## 11) Suposicoes

- O novo limite desejado para esta entrega e 5 MB.
- O aumento para 5 MB e aceitavel para o banco neste momento.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-03 |
| AC-02 | T-01, T-03 |
| AC-03 | T-02 |
| AC-04 | T-01, T-02 |
