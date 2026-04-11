# Spec Funcional - tela-login

## 1) Contexto

- Data: 2026-04-10
- Autor(a): Codex
- Status: Implemented
- Stakeholders: Produto, Frontend, UX

## 2) Problema

Ainda não existe uma tela de login com identidade visual definida para entrada no sistema. Isso impede um fluxo inicial consistente de autenticação e dificulta validação visual de UI.

## 3) Objetivo

Implementar uma tela de login fiel à referência `assets/login.png`, com estrutura, hierarquia visual e interações básicas funcionais, permitindo autenticação por credenciais e ação de login social (placeholder funcional).

## 4) Escopo

- Construir layout da tela de login com card central, gradiente de fundo e bloco inferior de cadastro.
- Implementar campos de identificação e senha com estados visuais (normal, foco, erro, desabilitado).
- Implementar botão principal de login e link "Forgotten password?".
- Implementar ação secundária "Log in with Facebook" como CTA alternativo (sem integração OAuth real neste ciclo).
- Garantir responsividade para mobile e desktop mantendo proporção e espaçamento próximos à referência.
- Garantir acessibilidade mínima (labels, navegação por teclado, contraste e foco visível).

## 5) Não-Escopo

- Implementação de backend de autenticação.
- Recuperação real de senha (somente roteamento para tela/ação futura).
- Integração OAuth real com Facebook.
- Internacionalização avançada e múltiplos temas.

## 6) Usuários e Cenários

- Usuário-alvo: usuário final tentando acessar o sistema por desktop ou celular.
- Cenários principais:
  - Usuário preenche credenciais válidas e envia formulário.
  - Usuário deixa campos inválidos e recebe feedback visual.
  - Usuário escolhe ação alternativa de login social.

## 7) Critérios de Aceite (testáveis)

Use formato passa/falha.

| ID | Critério | Como validar | Prioridade |
| --- | --- | --- | --- |
| AC-01 | A tela reproduz a composição da referência (`logo`, campos, botão principal, divisor `OR`, botão social e rodapé de cadastro) sem ausência de elementos obrigatórios. | Revisão visual manual lado a lado com `assets/login.png`. | Alta |
| AC-02 | O formulário possui dois campos obrigatórios (identificação e senha), com validação de obrigatoriedade no submit. | Teste manual + teste de integração do formulário. | Alta |
| AC-03 | O botão de mostrar/ocultar senha alterna tipo do campo sem perder foco no input. | Teste manual + teste unitário do componente de senha. | Média |
| AC-04 | O botão "Log In" executa ação de submit com estado de loading e bloqueio de múltiplos cliques enquanto processa. | Teste de integração com mock de autenticação. | Alta |
| AC-05 | O layout se adapta em breakpoints mobile e desktop sem quebra de alinhamento dos elementos principais. | Teste manual responsivo e captura de screenshots. | Alta |
| AC-06 | Elementos interativos são acessíveis por teclado e possuem foco visível. | Teste manual com Tab/Shift+Tab. | Média |

## 8) Requisitos Não Funcionais

- Performance: render inicial da tela em até 2s em ambiente local de desenvolvimento.
- Segurança: nunca logar senha em console, estado ou analytics.
- Acessibilidade: foco visível, labels associadas, mensagens de erro legíveis por leitor de tela (quando aplicável).
- Observabilidade: registrar eventos de tentativa de login (sucesso/erro) em mecanismo de logging existente (ou TODO documentado).

## 9) Casos de Erro e Comportamento Esperado

| Caso | Condição | Resposta esperada |
| --- | --- | --- |
| ER-01 | Usuário tenta enviar com campos vazios | Exibir mensagens de validação abaixo dos campos e manter foco no primeiro inválido. |
| ER-02 | Credenciais inválidas retornadas pela API/mock | Exibir mensagem geral de erro no formulário sem limpar campo de identificação. |
| ER-03 | Falha de rede/timeout no login | Exibir estado de erro com opção de nova tentativa e liberar botão novamente. |
| ER-04 | Usuário clica repetidamente em "Log In" durante processamento | Ignorar cliques extras e manter apenas uma submissão ativa. |

## 10) Dependências e Restrições

- Dependências: biblioteca de UI já adotada no projeto (ou CSS local), mecanismo de roteamento e camada de autenticação.
- Restrições: preservar fidelidade visual da referência sem copiar marcas protegidas em contexto de produção final (se aplicável).

## 11) Suposições

- Existe (ou será criado no próximo incremento) endpoint/serviço de autenticação para integrar o submit.
- O uso da estética de referência é apenas para prototipação visual interna.

## 12) Rastreabilidade inicial

Mapeie cada critério de aceite para tarefas no plano técnico.

| Critério | Tarefa(s) do plano |
| --- | --- |
| AC-01 | T-01, T-02 |
| AC-02 | T-03 |
| AC-03 | T-04 |
| AC-04 | T-05 |
| AC-05 | T-06 |
| AC-06 | T-07 |
