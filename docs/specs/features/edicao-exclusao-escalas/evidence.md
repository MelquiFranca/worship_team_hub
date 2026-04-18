# Evidencias - edicao-exclusao-escalas

## Checklist pratico de implementacao

- [ ] Card de escala exibe acao `Editar escala` com redirecionamento para modo edicao (AC-01).
- [ ] Formulario em modo edicao carrega dados existentes e permite alterar campos validos (AC-02).
- [ ] Salvamento de edicao retorna feedback de sucesso e atualiza listagem (AC-03).
- [ ] Acao de excluir aparece apenas para audiencia `group-app` (AC-04).
- [ ] Exclusao exige confirmacao explicita antes da remocao definitiva (AC-05).
- [ ] Exclusao confirmada remove item da listagem e exibe feedback ao usuario (AC-06).
- [ ] Audiencia `component-app` nao consegue editar/excluir na UI e no backend (AC-07).
- [ ] Erros de update/delete preservam contexto e exibem mensagem acionavel (AC-08).

## Checklist pratico de testes

- [ ] Teste manual de navegacao: listagem -> editar escala -> retorno para listagem.
- [ ] Teste de integracao do formulario em modo edicao com dados pre-existentes.
- [ ] Teste de integracao para update bem sucedido e update com falha de rede.
- [ ] Teste manual e de integracao da confirmacao de exclusao (confirmar e cancelar).
- [ ] Teste de permissao por audiencia: `group-app` autorizado e `component-app` bloqueado.
- [ ] Teste de autorizacao server-side com tentativa direta de update/delete sem permissao (esperado `403`).
- [ ] Regressao basica no modo criacao de escalas para garantir ausencia de quebra.

## Artefatos a anexar apos implementacao

- [ ] Arquivos de codigo alterados no card da listagem de escalas.
- [ ] Arquivos de codigo alterados no formulario de escalas (modo edicao/exclusao).
- [ ] Evidencias de testes (logs, snapshots ou output resumido).
- [ ] Atualizacao de `validation.md` com resultados Pass/Fail reais por AC.

## Estado atual

- Fluxo SDD documentado em 2026-04-15.
- Implementacao de codigo ainda nao iniciada neste pacote.
