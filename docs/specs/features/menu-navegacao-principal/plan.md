# Plano Tecnico - menu-navegacao-principal

## 1) Referencia da Spec

- Feature: menu-navegacao-principal
- Documento: `features/menu-navegacao-principal/spec.md`
- Versao da spec: v1

## 2) Estrategia de Implementacao

Construir o menu principal em camadas: primeiro a estrutura fixa do rodape com a ordem correta dos itens, depois os menus flutuantes do botao "+" e do avatar, em seguida a integracao com rotas e fluxo de sessao, finalizando com responsividade, acessibilidade e validacao.

## 3) Tarefas Incrementais

| ID | Tarefa | Relaciona com AC | Tipo de teste | Evidencia |
| --- | --- | --- | --- | --- |
| T-01 | Criar a estrutura base do menu fixo inferior com os 5 itens na ordem definida | AC-01 | Manual | Screenshot do layout base |
| T-02 | Integrar os acessos de Escalas e Componentes com rotas principais e estado ativo | AC-01, AC-02 | Integracao | Teste de navegacao e destaque ativo |
| T-03 | Implementar o botao "+" com menu flutuante e rotas para cadastro de escalas e componentes | AC-03, AC-04 | Integracao + manual | Teste de abertura, fechamento e redirecionamento |
| T-04 | Implementar o avatar do usuario com menu flutuante para Editar Perfil e Sair | AC-05, AC-06, AC-07 | Integracao + manual | Teste de abertura e acoes do menu do perfil |
| T-05 | Ajustar responsividade, areas seguras, estados de foco e fechamento por teclado/clique fora | AC-08, AC-09 | Manual + acessibilidade | Checklist responsivo e a11y |
| T-06 | Integrar fallback de avatar e tratamento de indisponibilidade de rota/logout | AC-07, AC-08 | Integracao | Teste de erro e fallback |
| T-07 | Consolidar validacao final e rastreabilidade em `validation.md` | AC-01 a AC-09 | Manual | Documento de validacao atualizado |

## 4) Ordem de Execucao

1. Montar a estrutura fixa do menu inferior e sua composicao visual (T-01).
2. Conectar navegacao das entradas principais Escalas e Componentes (T-02).
3. Entregar os menus flutuantes do botao "+" e do avatar (T-03, T-04).
4. Refinar acessibilidade, responsividade e area segura em mobile (T-05).
5. Cobrir fallbacks de sessao e indisponibilidade (T-06).
6. Fechar validacao e evidencias do fluxo completo (T-07).

## 5) Riscos e Mitigacoes

| Risco | Impacto | Probabilidade | Mitigacao |
| --- | --- | --- | --- |
| Menu fixo cobrir conteudo importante em mobile | Alto | Media | Usar padding inferior, safe-area e testes visuais em varios breakpoints. |
| Menus flutuantes abrirem fora de area visivel | Medio | Media | Posicionar com ancoragem consistente e ajustar deslocamento dinamico. |
| Inconsistencia entre estado visual e rota ativa | Medio | Media | Centralizar a logica de rota ativa em helper compartilhado. |
| Falha no fluxo de logout ou perfil sem sessao | Alto | Media | Tratar fallback de sessao e redirecionar com mensagem clara. |

## 6) Estrategia de Rollout

- Feature flag: Recomendado
- Migracao necessaria: Nao
- Plano de fallback: manter a navegacao atual ate o menu principal estar validado em todos os breakpoints.
- Plano de rollback: remover o menu fixo e seus gatilhos sem alterar rotas existentes.

## 7) Criterios de Pronto por Incremento

- [ ] Tarefa implementada
- [ ] Testes executados
- [ ] Evidencias registradas
- [ ] Sem regressao critica

## 8) Registro de Decisoes Tecnicas

| Data | Decisao | Motivacao | Impacto |
| --- | --- | --- | --- |
| 2026-04-11 | Fixar o menu no rodape com acao central em "+" | Melhorar acesso rapido as funcoes mais recorrentes | Aumenta descoberta das acoes de criacao |
| 2026-04-11 | Separar menus flutuantes por contexto (criacao e perfil) | Reduzir confusao e manter hierarquia de acoes clara | UX mais previsivel e facil de testar |
