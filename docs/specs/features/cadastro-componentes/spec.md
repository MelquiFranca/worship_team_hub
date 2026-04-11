# Spec Funcional - cadastro-componentes

## 1) Contexto

- Data: 2026-04-11
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, UX, Lideranca

## 2) Problema

Nao existe uma tela dedicada para cadastro de componentes. O processo atual impede padronizacao do cadastro, dificulta validacao dos dados e nao reaproveita a identidade visual ja consolidada na tela de escalas.

## 3) Objetivo

Implementar a tela de cadastro de componentes com a mesma identidade visual da tela de escalas, incluindo formulario completo com upload e pre-visualizacao de foto, credenciais e selecao de data de nascimento por calendario reutilizavel sem bibliotecas externas.

## 4) Escopo

- Criar rota de cadastro de componentes com layout alinhado a tela de escalas.
- Implementar formulario com os campos:
  - upload e pre-visualizacao de foto;
  - nome completo;
  - data de nascimento com calendario;
  - usuario;
  - senha.
- Implementar calendario reutilizavel sem biblioteca externa para selecao de data.
- Aplicar validacoes basicas de formulario (obrigatoriedade e formato minimo).
- Preparar estrutura para reaproveito do calendario em outras telas (ex.: cadastro de escalas).

## 5) Nao-Escopo

- Persistencia real em backend (pode usar mock/callback neste ciclo).
- Fluxo de edicao e exclusao de componentes.
- Regras avancadas de seguranca de senha (politicas corporativas completas).
- Crop/edicao de imagem apos upload.

## 6) Usuarios e Cenarios

- Usuario-alvo: lideres e administradores responsaveis por cadastro.
- Cenarios principais:
  - Usuario cadastra novo componente preenchendo todos os campos obrigatorios.
  - Usuario faz upload de foto e confirma pre-visualizacao antes de salvar.
  - Usuario seleciona data de nascimento pelo calendario sem digitar manualmente.

## 7) Criterios de Aceite (testaveis)

Use formato passa/falha.

| ID | Criterio | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | A tela de cadastro de componentes mantem identidade visual consistente com tela de escalas (paleta, bordas, tipografia e espacamentos). | Revisao manual comparativa. | Alta |
| AC-02 | O formulario renderiza os campos: foto, nome completo, data de nascimento, usuario e senha. | Teste manual + teste de renderizacao. | Alta |
| AC-03 | Upload de foto permite pre-visualizacao imediata no formulario. | Teste manual de upload local + teste de integracao do estado da foto. | Alta |
| AC-04 | Campo data de nascimento usa calendario customizado sem biblioteca externa e permite selecionar uma data valida. | Teste manual + teste de componente do calendario. | Alta |
| AC-05 | Componente de calendario pode ser reutilizado em outra tela sem duplicacao de logica. | Revisao de arquitetura + teste de uso em ao menos 2 formularios. | Alta |
| AC-06 | Formulario impede envio com campos obrigatorios vazios e exibe feedback claro. | Teste de integracao de validacao. | Alta |
| AC-07 | Campo senha possui comportamento seguro minimo (mascarado por padrao) e controle de exibicao opcional. | Teste manual + componente. | Media |

## 8) Requisitos Nao Funcionais

- Performance: abertura e navegacao do calendario sem travamentos perceptiveis.
- Seguranca: nao expor senha em logs; limpar URL de preview quando necessario para evitar vazamento.
- Acessibilidade: foco visivel, labels associadas e navegacao por teclado no calendario.
- Observabilidade: registrar tentativa de submit (sucesso/erro) em ponto unico de logging.

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condicao | Resposta esperada |
| --- | --- | --- |
| ER-01 | Usuario envia formulario com campos obrigatorios vazios | Exibir mensagens de erro por campo e bloquear submit. |
| ER-02 | Upload de arquivo nao imagem | Exibir erro de formato e manter campo sem preview valida. |
| ER-03 | Usuario tenta selecionar data invalida no calendario | Bloquear selecao e manter valor anterior. |
| ER-04 | Falha no submit (mock/API) | Exibir feedback de erro e liberar nova tentativa sem limpar campos essenciais. |

## 10) Dependencias e Restricoes

- Dependencias: Next.js App Router atual, padrao de estilos existente, componente reutilizavel de calendario.
- Restricoes: sem uso de biblioteca externa para calendario.

## 11) Suposicoes

- O calendario sera criado como componente em `src/components` e reutilizado por outras telas.
- O fluxo inicial pode usar dados mock para submit.
- A validacao de usuario unico sera tratada em ciclo de integracao backend.

## 12) Rastreabilidade inicial

| Criterio | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-03 |
| AC-03 | T-04 |
| AC-04 | T-05 |
| AC-05 | T-05, T-08 |
| AC-06 | T-06 |
| AC-07 | T-07 |
