# Evidencias - permissao-tipo-cadastro-componentes

## Checklist de evidencias tecnicas

- [ ] Contrato de API documentado com campo `permissionType` e enum aceito (`admin-panel`, `group-app`, `component-app`).
- [ ] Validacao backend para `permissionType` implementada com retorno `400` para valor invalido/ausente.
- [ ] Persistencia de `permissionType` confirmada na colecao `components`.
- [ ] Endpoints de resposta (`POST`/`GET`) retornando `permissionType` no contrato.
- [ ] Compatibilidade retroativa validada para documentos legados sem `permissionType`.
- [ ] Testes de integracao (frontend/backend) adicionados ou atualizados.

## Checklist de evidencias funcionais

- [ ] Campo "tipo de permissao" visivel na UI de cadastro de componente.
- [ ] Selecao de valor do enum funcionando no formulario.
- [ ] Submit valido enviando `permissionType` no payload.
- [ ] Mensagem de erro amigavel exibida para valor invalido.
- [ ] Cadastro concluido com sucesso e retorno contendo `permissionType`.
- [ ] Listagem/uso de componentes antigos sem falha funcional.

## Artefatos esperados

- Logs de teste de integracao backend para AC-03, AC-04, AC-05.
- Evidencia de teste de integracao frontend para AC-01 e AC-02.
- Registro de regressao manual para AC-06.
- Atualizacao de `validation.md` com Pass/Fail apos execucao dos testes.
