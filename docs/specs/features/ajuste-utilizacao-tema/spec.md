# Spec Funcional - ajuste-utilizacao-tema

## 1) Contexto

- Data: 2026-04-11
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, UX, Lideranca, QA

## 2) Problema

A aplicacao usa tema de forma parcial e inconsistente entre telas e componentes graficos. Isso gera divergencia visual, dificulta manutencao e impede personalizacao global previsivel.

## 3) Objetivo

Aplicar o tema em todos os componentes graficos existentes, padronizando o consumo de tokens globais para cores, bordas, sombras, estados de foco e fundos, sem regressao visual critica.

## 4) Escopo

- Mapear componentes e paginas existentes que ainda usam cores/estilos hardcoded fora do tema.
- Substituir valores hardcoded por tokens globais de tema.
- Padronizar estados visuais (default, hover, active, focus, disabled) usando tokens.
- Garantir que telas principais (login, escalas, componentes, cadastros e configuracoes) consumam o tema global.
- Garantir fallback seguro quando token nao existir.

## 5) Nao-Escopo

- Criar novo design system completo.
- Redesenhar layout/UX das telas.
- Implementar temas por perfil de usuario.
- Alterar regras de negocio da aplicacao.

## 6) Usuarios e Cenarios

- Usuario-alvo: lideres, administradores e membros que usam a aplicacao.
- Cenarios principais:
  - Usuario navega entre telas e percebe consistencia visual.
  - Usuario altera tema do grupo e ve refletir nos componentes graficos.
  - Time de desenvolvimento evolui UI reutilizando tokens globais.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | Todos os componentes graficos ativos no projeto consomem tokens globais de tema para cores principais e texto. | Revisao tecnica por grep/inspecao + teste manual visual. | Alta |
| AC-02 | Bordas, sombras e superficies dos componentes principais usam tokens padronizados. | Revisao de CSS Modules/globals + teste visual. | Alta |
| AC-03 | Estados de foco visivel e interacao (hover/active/disabled) usam tokens globais, sem regressao de acessibilidade. | Teste manual de acessibilidade + revisao de estilos. | Alta |
| AC-04 | Ao alterar valores dos tokens centrais, telas principais refletem mudanca de forma consistente. | Teste manual controlado de troca de tokens. | Alta |
| AC-05 | Componentes sem token especifico aplicam fallback seguro sem quebra visual. | Teste de erro/remocao de token em ambiente local. | Media |

## 8) Requisitos Nao Funcionais

- Performance: alteracao de tema nao deve exigir recarregamento completo para refletir estilo.
- Seguranca: nenhum dado sensivel envolvido; mudancas devem ser estritamente visuais.
- Acessibilidade: manter contraste minimo e foco visivel em todos os componentes interativos.
- Observabilidade: registrar pontos de migracao e cobertura de componentes para auditoria tecnica.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Token removido ou nomeado incorretamente | Aplicar fallback seguro e registrar alerta tecnico. |
| ER-02 | Tela com estilo legado fora do tema | Identificar no checklist e corrigir antes de fechar validacao. |
| ER-03 | Contraste insuficiente apos troca de token | Ajustar token/fallback e bloquear aprovacao visual ate corrigir. |

## 10) Dependencias e Restricoes

- Dependencias: `src/app/globals.css`, componentes existentes, feature de configuracoes de tema do grupo.
- Restricoes: manter compatibilidade visual com identidade atual da aplicacao.

## 11) Suposicoes

- Tokens globais atuais em `:root` serao a base da migracao.
- Todas as telas relevantes estao dentro do escopo de pastas atuais em `src/app` e `src/components`.
- Ajustes de tema nao alteram contratos de dados.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-02, T-03 |
| AC-03 | T-03 |
| AC-04 | T-04 |
| AC-05 | T-05 |

## 13) Resultado

- Status da entrega: Implemented
- Cobertura aplicada em: home, escalas, componentes, cadastro-componentes, cadastro-escalas, navegacao principal e modulos correlatos fora de login.
- Login e `LoginCard` foram mantidos fora do escopo, conforme solicitado.
