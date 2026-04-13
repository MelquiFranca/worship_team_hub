# Validação - autenticacao-jwt-audiencias

## Evidências por Critério de Aceite

| Critério | Resultado (Pass/Fail) | Evidência | Observações |
| --- | --- | --- | --- |
| AC-01 | Fail | A definir na implementação | Pendente implementação de emissão JWT e inspeção de claims. |
| AC-02 | Fail | A definir na implementação | Pendente tratamento de falhas de credencial e mensagens padronizadas. |
| AC-03 | Fail | A definir na implementação | Pendente middleware/policies para `aud=admin-panel`. |
| AC-04 | Fail | A definir na implementação | Pendente enforcement para `aud=group-app` e escopo de `groupId`. |
| AC-05 | Fail | A definir na implementação | Pendente enforcement para `aud=component-app` e escopo do componente. |
| AC-06 | Fail | A definir na implementação | Pendente endpoint de refresh rotativo com proteção a replay. |
| AC-07 | Fail | A definir na implementação | Pendente logout com revogação de refresh token. |
| AC-08 | Fail | A definir na implementação | Pendente padronização de respostas `401` e `403`. |
| AC-09 | Fail | A definir na implementação | Pendente logs estruturados sem dados sensíveis. |
| AC-10 | Fail | A definir na implementação | Pendente integração frontend sem dependência de sessão mock. |

## Resultado final

- Status: Parcial
- Data: 2026-04-12
- Responsável: Codex

## Pendências e Riscos Residuais

- Feature ainda não implementada; documento representa baseline de validação para execução.
- Definir estratégia final de chave JWT (HS256 vs RS256) conforme política de segurança do ambiente.
- Confirmar política de retenção/revogação de refresh tokens para auditoria.
