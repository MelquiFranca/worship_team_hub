# Evidências - regras-permissoes-app

## Registro de Execução

- Data inicial: 2026-04-13
- Status: Em preparação

## Artefatos esperados

- Capturas de tela por perfil (`admin-panel`, `group-app`, `component-app`).
- Logs de testes de integração de autorização.
- Evidências de bloqueio server-side (`403`) para ações proibidas.
- Evidência visual do destaque do usuário logado na escala.

## Checklist rápido

- [ ] Menu de `component-app` restrito a Escalas, Componentes e Avatar.
- [ ] Edição de perfil de `component-app` sem alteração de nome.
- [ ] Ações proibidas para `component-app` bloqueadas em UI e backend.
- [ ] Destaque do componente logado aplicado nas escalas em que participa.
- [ ] Rotas públicas de login acessíveis sem autenticação.
