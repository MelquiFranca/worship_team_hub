import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

test('rota raiz declara redirecionamento para /login', async () => {
  const rootPagePath = path.resolve(process.cwd(), 'src/app/page.js');
  const pageSource = await readFile(rootPagePath, 'utf-8');

  assert.equal(pageSource.includes("redirect('/login')"), true);
});
