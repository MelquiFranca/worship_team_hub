# Evidencias - integracao-listagens-componentes-escalas

## Implementacao alvo

- Tela de componentes consumindo `GET /api/components` no caminho principal.
- Tela de escalas consumindo `GET /api/scales` no caminho principal.
- Contrato de dados estavel para `ComponentsGallery` e `ScaleFeed` via camada de adaptacao.
- Estados de `loading`, `vazio`, `erro` e `retry` implementados nas duas listagens.
- Regras de permissao/sessao respeitadas conforme fluxo ja existente no app.

## Checklist pratico de evidencias a coletar

- [ ] Captura de rede (ou log de teste) mostrando chamada bem-sucedida a `GET /api/components`.
- [ ] Captura de rede (ou log de teste) mostrando chamada bem-sucedida a `GET /api/scales`.
- [ ] Evidencia de que mocks locais nao sao mais usados no caminho principal de renderizacao (`rg`/diff).
- [ ] Screenshot/video do estado de loading na tela de componentes.
- [ ] Screenshot/video do estado de loading na tela de escalas.
- [ ] Screenshot/video do estado vazio para `components` com resposta `[]`.
- [ ] Screenshot/video do estado vazio para `scales` com resposta `[]`.
- [ ] Screenshot/video do estado de erro para falha `500` em `components`.
- [ ] Screenshot/video do estado de erro para falha de rede em `scales`.
- [ ] Evidencia de retry funcionando (antes/depois da nova tentativa) em ambas as telas.
- [ ] Log/teste comprovando adaptacao de payload desnormalizado sem quebra de renderizacao.
- [ ] Log/teste para cenario autorizado (`200`) nas duas listagens.
- [ ] Log/teste para cenario de sessao expirada (`401`) com comportamento esperado.
- [ ] Log/teste para cenario sem permissao (`403`) com comportamento esperado.
- [ ] Resultado de `npm run lint` apos integracao.
- [ ] Resultado de suite de testes relevante (unitario/integracao) apos integracao.

## Artefatos esperados para anexar

- Arquivos de teste atualizados (componentes, integracao e adaptadores).
- Capturas de tela por estado (loading, vazio, erro) em `componentes` e `escalas`.
- Trechos de log da execucao de testes e build/lint.
- Referencias de codigo dos pontos de integracao e do contrato de dados.

## Comandos de validacao planejados

- `npm run lint`
- `npm run test`
- `npm run build`

## Observacao de status atual (planejamento)

No momento, este documento define apenas o checklist de coleta. As evidencias serao anexadas apos a implementacao tecnica da feature.
