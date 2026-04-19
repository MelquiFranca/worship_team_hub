# Evidencias - integracao-grupos-admin-banco

## Implementacao alvo

- Listagem administrativa de grupos sem dados ficticios em `src/data/groups.js`.
- Consulta real em MongoDB para collection `groups`.
- Resolucao de imagem via `group_settings` (`photo`/`photoUrl`) com fallback para `groups.photoUrl`.
- Fallback visual por iniciais quando nao houver foto.
- Tratamento de erro de banco e estado vazio sem quebra da pagina.

## Evidencias de codigo coletadas

- Arquivo atualizado: `src/app/admin/grupos/page.js`
  - remove import de `@/data/groups`
  - adiciona `loadGroupsFromDatabase()` com leitura de `db.collection('groups')`
  - adiciona merge com `group_settings` para foto
  - adiciona estados de `loadError` e lista vazia
- Arquivo atualizado: `src/app/admin/grupos/page.module.css`
  - adiciona estilo `.groupMediaFallback` para placeholder por iniciais
- Arquivo removido: `src/data/groups.js`
  - elimina fonte de dados ficticia da listagem

## Checklist pratico

- [x] Nao ha mais import de `@/data/groups` na pagina administrativa.
- [x] A tela consulta `groups` no MongoDB no caminho principal.
- [x] A tela tenta resolver foto via `group_settings`.
- [x] Existe fallback visual para grupo sem imagem.
- [x] Existe estado vazio quando `groups` retorna sem itens.
- [x] Existe mensagem de erro para indisponibilidade do banco.
- [x] Resultado de `npm run lint` anexado.

## Comandos de validacao planejados

- `npm run lint`
