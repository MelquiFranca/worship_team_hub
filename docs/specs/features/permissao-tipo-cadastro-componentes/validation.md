# Validacao - permissao-tipo-cadastro-componentes

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Fail | Pendente implementacao da UI do campo no formulario de cadastro. | Executar teste manual e de renderizacao apos T-02. |
| AC-02 | Fail | Pendente ajuste de submit/frontend para envio de `permissionType`. | Validar payload no teste de integracao apos T-03. |
| AC-03 | Fail | Pendente validacao de enum no endpoint de cadastro de componentes. | Cobrir cenarios valido/invalido apos T-04. |
| AC-04 | Fail | Pendente persistencia e retorno de `permissionType` no backend/banco. | Verificar documento salvo e resposta de criacao apos T-05. |
| AC-05 | Fail | Pendente retorno consistente em endpoints de leitura para novos e legados. | Validar contrato de resposta apos T-05/T-06. |
| AC-06 | Fail | Pendente prova de compatibilidade retroativa com fixtures antigas. | Executar regressao funcional e integracao apos T-06/T-07. |

## Resultado final

- Status: Reprovado
- Data: 2026-04-15
- Responsavel: Codex

## Pendencias e Riscos Residuais

- Implementar campo "tipo de permissao" no formulario e fluxo de submit.
- Implementar validacao de enum e persistencia no backend.
- Validar fallback retroativo para componentes antigos sem `permissionType`.
- Executar testes de regressao para evitar quebra nas telas consumidoras.
