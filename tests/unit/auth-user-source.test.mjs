import assert from 'node:assert/strict';
import test from 'node:test';
import { AUTH_ERROR_CODES } from '../../src/lib/auth/errors.js';
import { loadAuthUsers } from '../../src/lib/auth/userSource.js';

test('loadAuthUsers retorna erro tipado quando persistencia nao esta configurada', async () => {
  const previousMongoUri = process.env.MONGODB_URI;

  delete process.env.MONGODB_URI;

  try {
    await assert.rejects(
      async () => loadAuthUsers(),
      (error) => error?.code === AUTH_ERROR_CODES.DEPENDENCY_UNAVAILABLE && error?.status === 503
    );
  } finally {
    if (typeof previousMongoUri === 'string') {
      process.env.MONGODB_URI = previousMongoUri;
    } else {
      delete process.env.MONGODB_URI;
    }
  }
});
