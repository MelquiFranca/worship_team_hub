# Plano Tecnico - avatar-usuario-menu-principal

## 1) Referencia da Spec

- Feature: avatar-usuario-menu-principal
- Documento: `features/avatar-usuario-menu-principal/spec.md`
- Versao da spec: v1
- Data: 2026-04-20

## 2) Estrategia de Implementacao

Implementacao focada em consistencia de identidade do usuario logado no menu principal, com resolucao progressiva de dados: perfil autenticado (`/api/auth/profile`) como fonte preferencial e sessao (`AuthSessionContext`) como fallback resiliente.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Normalizar nome/foto do usuario logado para uso do avatar (`normalizeString`, `normalizeProfile`, `sessionName`, `sessionPhoto`, `avatarName`, `avatarPhoto`). | AC-01, AC-02, AC-03 | Revisao de codigo | `src/components/organisms/MainBottomNav/MainBottomNav.jsx` |
| T-02 | Carregar perfil autenticado com `requestJson('/api/auth/profile')` e aplicar estado local `profile`. | AC-01, AC-04 | Integracao manual | `src/components/organisms/MainBottomNav/MainBottomNav.jsx` |
| T-03 | Renderizar avatar com prioridade para foto resolvida e fallback por iniciais quando nao houver foto. | AC-01, AC-02 | Manual UI | `src/components/organisms/MainBottomNav/MainBottomNav.jsx` |
| T-04 | Garantir degradacao graciosa quando API de perfil falhar (sem quebra da navegacao/avatar). | AC-03, AC-04 | Manual + revisao de codigo | `src/components/organisms/MainBottomNav/MainBottomNav.jsx` |
| T-05 | Preservar itens e comportamento do popover do avatar no menu principal. | AC-05 | Manual UI | `src/components/organisms/MainBottomNav/MainBottomNav.jsx` |
| T-06 | Validar qualidade estatica dos arquivos-chave da feature. | AC-01..AC-05 | Lint | `npm run lint -- --file src/components/organisms/MainBottomNav/MainBottomNav.jsx --file src/app/api/auth/profile/route.js --file src/lib/auth/profile.js` |

## 4) Ordem de Execucao

1. Consolidar fonte de dados de identidade do usuario no `MainBottomNav`.
2. Integrar carregamento de perfil autenticado via API.
3. Ajustar renderizacao do avatar e fallback de iniciais.
4. Verificar resiliencia em erro de perfil.
5. Confirmar ausencia de regressao no popover e executar lint.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| API de perfil indisponivel gerar avatar vazio | Medio | Media | Fallback para dados de sessao e iniciais default. |
| Nome inconsistente entre sessao e perfil | Baixo | Media | Prioridade explicita: `profile` > `session` > valor padrao. |
| Regressao no menu do avatar (links/acoes) | Medio | Baixa | Manter estrutura do popover e validar itens manualmente. |
| Foto invalida causar erro visual | Baixo | Baixa | Normalizacao de string e fallback textual no render. |

## 6) Estrategia de Rollout

- Feature flag: Nao
- Migracao necessaria: Nao
- Plano de fallback: manter resolucao por sessao quando perfil remoto falhar.
- Plano de rollback: remover carregamento de perfil remoto e retornar ao fluxo anterior do avatar.

## 7) Criterios de Pronto por Incremento

- [x] Tarefas implementadas
- [x] Criterios de aceite mapeados para tarefas
- [x] Validacao tecnica executada (lint)
- [x] Evidencias registradas

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-20 | Usar `/api/auth/profile` como fonte preferencial de nome/foto. | Representar identidade real do usuario logado no avatar. | Avatar coerente com tela de perfil. |
| 2026-04-20 | Manter fallback com dados de sessao (`useAuthSession`). | Evitar quebra visual em falhas de rede/API. | Navegacao resiliente e previsivel. |
| 2026-04-20 | Fallback final por iniciais no proprio componente. | Garantir avatar sempre renderizavel. | Melhor UX e robustez. |
