# Evidencias - backend-cadastro-componentes-escalas

## Escopo planejado

- Backend de componentes com listagem e cadastro persistidos em MongoDB.
- Backend de escalas com listagem e cadastro persistidos em MongoDB.
- Integracao das telas de cadastro de componentes e escalas com APIs reais.
- Endurecimento de seguranca para uso de credenciais e autorizacao por audiencia.

## Checklist de evidencias

### Infra de banco e seguranca

- [ ] Evidencia de modulo de conexao MongoDB com leitura de `MONGODB_URI` e `MONGODB_DB_NAME`.
- [ ] Evidencia de ausencia de segredo hardcoded no codigo fonte.
- [ ] Evidencia de sanitizacao de erros/logs sem vazamento de credenciais.
- [ ] Evidencia de indices criados para consultas principais (`groupId`, `createdAt`, `username`).

### API Cadastro de componentes

- [ ] Evidencia de `POST /api/components` com persistencia bem-sucedida.
- [ ] Evidencia de validacao de payload invalido com retorno `400`.
- [ ] Evidencia de bloqueio de audiencia nao autorizada com retorno `403`.
- [ ] Evidencia de `GET /api/components` retornando lista por contexto de grupo.

### API Cadastro de escalas

- [ ] Evidencia de `POST /api/scales` com persistencia bem-sucedida.
- [ ] Evidencia de validacao de regras (data/turno/componentes/funcoes) com retorno `400`.
- [ ] Evidencia de bloqueio de audiencia nao autorizada com retorno `403`.
- [ ] Evidencia de `GET /api/scales` retornando escalas por grupo.

### Integracao frontend

- [ ] Evidencia de submit real em `ComponentRegistrationForm` com estados de loading/sucesso/erro.
- [ ] Evidencia de consumo de `GET /api/components` em `ScaleRegistrationForm`.
- [ ] Evidencia de submit real em `ScaleRegistrationForm` para `POST /api/scales`.
- [ ] Evidencia de mensagens de erro amigaveis e reenvio apos falha.

### Regressao e qualidade

- [ ] Evidencia de `npm run lint` sem erros.
- [ ] Evidencia de `npm run build` sem erros.
- [ ] Evidencia de smoke manual para fluxos de cadastro de componente e escala.

## Validacoes executadas

- Em planejamento. Evidencias serao anexadas apos a implementacao incremental das tarefas T-01 a T-10.

