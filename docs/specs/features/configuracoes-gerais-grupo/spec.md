# Spec Funcional - configuracoes-gerais-grupo

## 1) Contexto

- Data: 2026-04-11
- Autor(a): Codex
- Status: Proposed
- Stakeholders: Produto, Frontend, UX, Ministerio/Lideranca, QA

## 2) Problema

A aplicacao nao possui uma tela central para manutencao das configuracoes gerais do grupo. Isso obriga ajustes dispersos, dificulta padronizacao visual entre telas e impede controlar de forma simples o nome, a foto, as funcoes disponiveis nas escalas e o tema de cores usado na aplicacao.

## 3) Objetivo

Criar uma tela de configuracoes gerais do grupo com identidade visual consistente com a tela de escalas, permitindo atualizar nome, foto, funcoes disponiveis e tema de cores, com tokens globais reutilizaveis em toda a aplicacao.

## 4) Escopo

- Criar tela de configuracoes gerais do grupo seguindo a identidade visual da tela de escalas.
- Permitir configurar o nome do grupo.
- Permitir configurar a foto do grupo.
- Permitir configurar as funcoes disponiveis para execucao nas escalas.
- Permitir configurar o tema de cores do grupo.
- Definir e padronizar tokens globais de tema para uso reutilizavel em toda a aplicacao.
- Garantir que as mudancas de tema reflitam nas telas existentes sem romper a leitura visual.

## 5) Nao-Escopo

- Regras completas de permissao por perfil.
- Persistencia final em backend ou integracoes externas especificas.
- Editor avancado de imagem com recorte, filtros ou tratamento de midia.
- Regras de historico, auditoria ou versionamento das configuracoes.
- Internacionalizacao da interface.

## 6) Usuarios e Cenarios

- Usuario-alvo: lideres, administradores do grupo e perfis responsaveis por manutencao da comunidade.
- Cenarios principais:
  - Usuario acessa a tela de configuracoes gerais e visualiza o mesmo padrao visual da tela de escalas.
  - Usuario altera o nome do grupo e ve o novo nome refletido na interface.
  - Usuario envia ou seleciona uma foto do grupo para atualizar a identidade visual.
  - Usuario seleciona funcoes disponiveis para as escalas e salva a configuracao.
  - Usuario escolhe um tema de cores e a aplicacao passa a consumir os tokens globais definidos.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | A tela de configuracoes gerais do grupo mantem identidade visual consistente com a tela de escalas. | Revisao visual comparativa e teste manual de layout em desktop e mobile. | Alta |
| AC-02 | O nome do grupo pode ser configurado e refletido na interface da aplicacao. | Teste de integracao do formulario e revisao manual do estado persistido. | Alta |
| AC-03 | A foto do grupo pode ser configurada e exibida no contexto da tela e das areas que consomem a identidade do grupo. | Teste manual de upload/selecion e snapshot visual. | Alta |
| AC-04 | As funcoes disponiveis para execucao nas escalas podem ser selecionadas, removidas e salvas. | Teste de integracao do formulario com mock de persistencia. | Alta |
| AC-05 | O tema de cores do grupo pode ser alterado por meio de configuracao dedicada. | Teste manual do seletor de tema e teste de integracao do estado. | Alta |
| AC-06 | O tema selecionado gera tokens globais reutilizaveis em toda a aplicacao. | Teste unitario da geracao/mapeamento de tokens e revisao de consumo em componentes-chave. | Alta |
| AC-07 | A troca do tema nao quebra contraste, estados de foco ou legibilidade nas telas principais. | Teste visual/regressao em telas chave e validacao de contraste. | Alta |
| AC-08 | Mudancas de configuracao possuem comportamento previsivel de fallback quando dados estiverem ausentes ou invalidos. | Teste de erro com dados nulos/inconsistentes. | Media |

## 8) Requisitos Nao Funcionais

- Performance: troca de tema e atualizacao de tokens devem ocorrer sem recarregamento completo da pagina.
- Seguranca: validacao de arquivos de imagem e restricao de formatos aceitos quando houver upload.
- Acessibilidade: controles com foco visivel, labels descritivos, suporte a teclado e contraste minimo adequado.
- Observabilidade: registrar mudancas de configuracao, falhas de validacao e eventos de troca de tema quando houver telemetria.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Nome do grupo vazio ou invalido | Bloquear salvamento e exibir mensagem clara de validacao. |
| ER-02 | Foto em formato nao suportado | Rejeitar arquivo e orientar formatos aceitos. |
| ER-03 | Nenhuma funcao selecionada | Exibir alerta de consistencia ou estado vazio conforme regra do produto. |
| ER-04 | Tema de cor gera contraste insuficiente | Bloquear aplicacao do tema ou sugerir ajuste seguro com fallback. |
| ER-05 | Token global ausente ou inconsistente | Aplicar token padrao seguro e registrar o problema para correcao. |

## 10) Dependencias e Restricoes

- Dependencias: tela de escalas, sistema de design atual, camada de tokens globais, suporte a persistencia das configuracoes e componentes de upload/formulario.
- Restricoes: a mudanca de tema tem impacto transversal e deve preservar compatibilidade com telas existentes e estados ja implementados.

## 11) Suposicoes

- A aplicacao tera uma fonte unica de verdade para configuracoes do grupo.
- Os tokens de tema poderao ser expostos em formato reutilizavel para componentes da aplicacao.
- A tela de configuracoes podera reutilizar padroes visuais e estruturais da tela de escalas sem duplicar comportamento desnecessario.

## 12) Rastreabilidade inicial

Mapeie cada criterio de aceite para tarefas no plano tecnico.

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-03 |
| AC-02 | T-02 |
| AC-03 | T-02 |
| AC-04 | T-02 |
| AC-05 | T-03, T-04 |
| AC-06 | T-04, T-05 |
| AC-07 | T-05, T-06 |
| AC-08 | T-02, T-06 |
