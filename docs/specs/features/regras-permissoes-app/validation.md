# Validação - regras-permissoes-app

## Evidências por Critério de Aceite

| Critério | Resultado (Pass/Fail) | Evidência | Observações |
| --- | --- | --- | --- |
| AC-01 | Fail | A definir na implementação | Pendente consolidação da matriz de permissão por JWT no client/server. |
| AC-02 | Fail | A definir na implementação | Pendente validação de acesso público para `/login` e `/admin/login`. |
| AC-03 | Fail | A definir na implementação | Pendente validação de acesso total admin em visão Admin. |
| AC-04 | Fail | A definir na implementação | Pendente validação de acesso total group-app em visão Grupo. |
| AC-05 | Fail | A definir na implementação | Pendente ajuste de menu principal para componente. |
| AC-06 | Fail | A definir na implementação | Pendente restrição de edição de nome em Editar Perfil. |
| AC-07 | Fail | A definir na implementação | Pendente validação das permissões positivas de componente em Escalas. |
| AC-08 | Fail | A definir na implementação | Pendente bloqueio de ações proibidas para componente (UI + server). |
| AC-09 | Fail | A definir na implementação | Pendente destaque visual do usuário logado nas escalas onde participa. |
| AC-10 | Fail | A definir na implementação | Pendente padronização de resposta para acessos/ações negadas. |

## Resultado final

- Status: Parcial
- Data: 2026-04-13
- Responsável: Codex

## Pendências e Riscos Residuais

- Feature ainda não implementada; esta validação é baseline para execução incremental.
- Definir estratégia final de UX para ações proibidas (`ocultar` vs `desabilitar`) por contexto.
- Confirmar mapeamento confiável entre `sub` do JWT e identidade de componente nas escalas.
