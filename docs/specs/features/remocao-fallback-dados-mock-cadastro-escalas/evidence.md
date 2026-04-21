# Evidencias - remocao-fallback-dados-mock-cadastro-escalas

## Registro de Execucao

- Data: 2026-04-21
- Status: Implementado (parcial em AC-08)

## Evidencias coletadas

- `ScaleRegistrationForm` nao importa mais `@/data/scales` e inicializa `componentOptions` vazio, sem fallback local.
- Carregamento de componentes passou a usar estados explicitos: `loading`, `ready`, `empty`, `error`.
- Em `error`, UI exibe mensagem e botao `Tentar novamente`; em `empty`, UI orienta cadastro previo sem povoar dados ficticios.
- Submit agora valida indisponibilidade de componentes e bloqueia salvamento quando nao ha componentes validos carregados.
- Modo edicao preserva componentes legados da escala via `mergeScaleComponentsIntoOptions`.
- Falhas no carregamento registram evento de observabilidade `components_load_failed` com `route`, `status`, `requestId` e `timestamp`.
- Validacao automatizada executada com sucesso: `npm run lint` e `npm test`.

## Checklist de artefatos

- [x] `npm run lint` sem erros apos alteracoes.
- [x] Busca textual sem referencias ativas a fallback mock no formulario (`@/data/scales`).
- [ ] Testes de frontend dedicados para cenarios de erro/vazio (infra atual nao cobre componentes React).
- [x] Evidencia de bloqueio de submit quando nao houver componentes validos.
- [x] Evidencia de fluxo de edicao preservado sem mock global.
- [x] Evidencia de evento/log de observabilidade para falha de carga.
- [x] `validation.md` atualizado com resultado final dos ACs.

## Rastreabilidade rapida

- AC-01: remocao de dependencia de mock.
- AC-02, AC-03, AC-06: estados e mensagens de UI para erro/vazio.
- AC-04: fluxo feliz com dados reais de API.
- AC-05: compatibilidade do modo edicao com dados da escala.
- AC-07: observabilidade de falha.
- AC-08: benchmark de performance de tela.
