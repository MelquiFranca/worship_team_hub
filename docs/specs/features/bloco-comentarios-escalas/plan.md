# Plano Tecnico - bloco-comentarios-escalas

## 1) Referencia da Spec

- Feature: bloco-comentarios-escalas
- Documento: `features/bloco-comentarios-escalas/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Implementar em camadas: primeiro modelagem de dados extensivel de mensagem, depois inclusao da nova view de comentarios no card, em seguida migracao de botoes para estilo iconico com acessibilidade. Finalizar com ajustes responsivos, testes e registro de evidencias.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Modelar estrutura de mensagem extensivel (`type`, `payload`, `meta`) e preparar mocks iniciais por escala | AC-04 | Unitario/Manual | Diff em `src/data/scales.js` e validacao de shape |
| T-02 | Adicionar terceira view do card (`COMMENTS_VIEW`) e acoplamento com estado por card no `ScaleFeed` | AC-01, AC-02, AC-08 | Integracao | Fluxo de alternancia entre views funcionando |
| T-03 | Substituir textos dos botoes de acao do card por icones sem perder `aria-label` e estados visuais | AC-01, AC-05, AC-06 | Visual + a11y manual | Screenshot e checklist de foco/teclado |
| T-04 | Implementar painel de chat estilo WhatsApp com lista de mensagens, estado vazio e diferenciacao visual por autor | AC-02, AC-03, AC-04, AC-08 | Integracao/Manual | Render do chat e alternancia de cards |
| T-05 | Implementar composer de texto (input + enviar), validacao de mensagem vazia e atualizacao otimista local | AC-03 | Integracao | Envio de mensagem e append imediato no historico |
| T-06 | Ajustar responsividade e acessibilidade final (320px+, foco, labels, leitura por screen reader) | AC-06, AC-07, AC-08 | Manual + a11y | Checklist responsivo e navegacao por teclado |
| T-07 | Consolidar validacao final e preencher `validation.md` + `evidence.md` | AC-01 a AC-08 | Manual | Documentos atualizados |

## 4) Ordem de Execucao

1. T-01: preparar contrato de dados de mensagens extensivel.
2. T-02: habilitar nova view de comentarios no card.
3. T-03: migrar botoes de acao para icones.
4. T-04: montar UI do chat e render de historico.
5. T-05: concluir fluxo de envio de texto.
6. T-06: validar responsividade e acessibilidade ponta a ponta.
7. T-07: registrar evidencias e fechar validacao.

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Perda de clareza ao trocar texto por icones | Alto | Media | Padronizar `aria-label`, `title` e icones semanticamente evidentes. |
| Chat crescer e ficar acoplado ao card monolitico | Medio | Media | Extrair painel/composer em subcomponentes com responsabilidades claras. |
| Regressao no estado de views por card | Alto | Media | Manter controle por `scaleId` estavel e cobrir alternancia em teste de integracao. |
| Quebra visual em mobile por excesso de botoes no rodape | Alto | Media | Reorganizar rodape com wrap e tamanhos minimos de toque (44px). |
| Falta de extensibilidade real para novos tipos de mensagem | Medio | Baixa | Definir desde agora renderizador por `type` com fallback seguro. |

## 6) Estrategia de Rollout

- Feature flag: Opcional (recomendado `ENABLE_SCALE_COMMENTS` para homologacao).
- Migracao necessaria: Nao.
- Plano de fallback: manter views atuais (`Componentes`/`Playlist`) e esconder `Comentarios` via flag.
- Plano de rollback: reverter alteracoes de `ScaleFeed` e CSS para versao anterior dos botoes textuais.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-11 | Usar view `COMMENTS_VIEW` dentro do mesmo card em vez de modal externo | Preservar contexto da escala e reduzir troca de foco | Menos friccao de navegacao |
| 2026-04-11 | Padrao de mensagem com `type` + `payload` | Permitir evolucao para anexos e interacoes futuras | Evita refactor estrutural precoce |
| 2026-04-11 | Migrar acoes para botoes iconicos com `aria-label` obrigatorio | Melhorar densidade visual sem perder acessibilidade | UI mais limpa e escalavel para mobile |
