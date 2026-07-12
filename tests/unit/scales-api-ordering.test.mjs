import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('GET /api/scales ordena escalas da mais antiga para a mais recente', async () => {
  const routeSource = await readFile(new URL('../../src/app/api/scales/route.js', import.meta.url), 'utf8');

  assert.match(
    routeSource,
    /scales\.find\(mongoFilter\)\.sort\(\{\s*date:\s*1,\s*createdAt:\s*1\s*\}\)/
  );
});
