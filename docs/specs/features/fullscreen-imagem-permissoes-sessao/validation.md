# Validacao - fullscreen-imagem-permissoes-sessao

## Evidencias por Criterio de Aceite

| Criterio | Resultado (Pass/Fail) | Evidencia | Observacoes |
| --- | --- | --- | --- |
| AC-01 | Fail | A definir na implementacao | Pendente abertura da imagem em fullscreen a partir do fluxo principal da tela. |
| AC-02 | Fail | A definir na implementacao | Pendente exibir botao explicito para sair do fullscreen. |
| AC-03 | Fail | A definir na implementacao | Pendente fechamento do fullscreen pela tecla `ESC` em desktop. |
| AC-04 | Fail | A definir na implementacao | Pendente bloqueio de editar imagem da escala para `component-app`. |
| AC-05 | Fail | A definir na implementacao | Pendente bloqueio de excluir imagem da escala para `component-app`. |
| AC-06 | Fail | A definir na implementacao | Pendente limpeza completa de sessao no logout. |
| AC-07 | Fail | A definir na implementacao | Pendente limpeza de sessao em expiracao de token antes de redirecionar para login. |
| AC-08 | Fail | A definir na implementacao | Pendente validacao de troca de conta sem heranca de permissoes/dados da sessao anterior. |

## Resultado final

- Status: Parcial
- Data: 2026-04-13
- Responsavel: Codex

## Pendencias e Riscos Residuais

- Feature ainda nao implementada; este arquivo serve como baseline de validacao pre-implementacao.
- Definir o padrao final de fullscreen para desktop e mobile, incluindo acessibilidade e fechamento.
- Confirmar o bloqueio de editar/excluir imagem para `component-app` em UI e camada server-side aplicavel.
- Validar a estrategia de limpeza de sessao em logout e expiracao de token para nao deixar estado stale.
