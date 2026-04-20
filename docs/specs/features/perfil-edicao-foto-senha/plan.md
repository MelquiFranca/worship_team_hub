# Plano Tecnico - perfil-edicao-foto-senha

## 1) Referencia da Spec

- Feature: perfil-edicao-foto-senha
- Documento: `features/perfil-edicao-foto-senha/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Separar a entrega em backend e frontend: primeiro construir o dominio/endpoint de perfil com persistencia por tipo de usuario, depois substituir a tela de fallback por um formulario funcional que consome a API.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Criar suporte de persistencia de overrides para usuarios seed no Mongo (`auth_user_overrides`). | AC-01, AC-04 | Integracao | `src/lib/db/mongodb.js` |
| T-02 | Implementar autenticacao e leitura de perfil atual no dominio `lib/auth/profile.js`. | AC-01 | Integracao | `src/lib/auth/profile.js` |
| T-03 | Implementar PATCH de foto/senha com validacoes no dominio de perfil. | AC-02, AC-03 | Integracao | `src/lib/auth/profile.js` |
| T-04 | Ajustar `loadAuthUsers` para mesclar senha override de usuarios seed. | AC-04 | Integracao | `src/lib/auth/userSource.js` |
| T-05 | Reescrever `/editar-perfil` com formulario completo, upload de foto e feedback. | AC-02, AC-05 | Manual | `src/app/editar-perfil/page.js` |

## 4) Ordem de Execucao

1. Persistencia e indices no Mongo.
2. Dominio e rota de perfil (`GET/PATCH`).
3. Ajuste de auth source para seed overrides.
4. Tela de edicao de perfil e validacoes de UX.
5. Validacao por lint e teste manual de fluxo.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Quebra de login de usuarios seed apos troca de senha. | Alto | Media | Mesclar `passwordHash` override em `loadAuthUsers` antes da autenticacao. |
| Divergencia de contrato de foto entre telas e API. | Medio | Baixa | Reusar `parseComponentPhotoInput` e `serializeComponentPhoto`. |
| Regressao de UX em `/editar-perfil`. | Medio | Media | Validar estados de loading/saving/erro e feedback visual. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Sim (nova colecao `auth_user_overrides`)
- Plano de fallback: manter operacao anterior de login sem override quando Mongo indisponivel.
- Plano de rollback: remover rota nova e restaurar fallback de `/editar-perfil`.

## 7) Criterios de Pronto por Incremento

- [x] Tarefa implementada
- [x] Testes executados
- [x] Evidencias registradas
- [x] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-20 | Criar colecao `auth_user_overrides` para seed users. | Evitar editar `src/data/authUsers.js` em runtime. | Permite persistencia de senha/foto para usuarios seed. |
| 2026-04-20 | Reusar parser de foto de componentes no perfil. | Manter consistencia de validacao e limite de upload. | Reduz duplicacao e risco de comportamento diferente. |
