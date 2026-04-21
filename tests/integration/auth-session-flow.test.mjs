import assert from 'node:assert/strict';
import test from 'node:test';
import { authenticateWithPassword, refreshAuthSession } from '../../src/lib/auth/service.js';
import { createPasswordHash } from '../../src/lib/auth/password.js';
import { AUTH_ERROR_CODES } from '../../src/lib/auth/errors.js';

const JWT_SECRET_FOR_TESTS = 'secret-jwt-de-integracao-com-32-chars-1234';
const BASE_USER = Object.freeze({
  id: 'owner-1',
  role: 'group_owner',
  groupId: 'group-1',
  groupStatus: 'active',
  email: 'owner@example.com',
  username: 'owner'
});

async function withJwtSecrets(callback) {
  const previousAuthSecret = process.env.AUTH_JWT_SECRET;
  const previousJwtSecret = process.env.JWT_SECRET;
  const previousRefreshStore = process.env.AUTH_REFRESH_STORE;

  process.env.AUTH_JWT_SECRET = JWT_SECRET_FOR_TESTS;
  process.env.JWT_SECRET = JWT_SECRET_FOR_TESTS;
  process.env.AUTH_REFRESH_STORE = 'memory';

  try {
    await callback();
  } finally {
    if (typeof previousAuthSecret === 'string') {
      process.env.AUTH_JWT_SECRET = previousAuthSecret;
    } else {
      delete process.env.AUTH_JWT_SECRET;
    }

    if (typeof previousJwtSecret === 'string') {
      process.env.JWT_SECRET = previousJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }

    if (typeof previousRefreshStore === 'string') {
      process.env.AUTH_REFRESH_STORE = previousRefreshStore;
    } else {
      delete process.env.AUTH_REFRESH_STORE;
    }
  }
}

function createUser(password = 'SenhaForte@123') {
  return {
    ...BASE_USER,
    passwordHash: createPasswordHash(password, {
      iterations: 1000,
      salt: 'salt-deterministico-para-teste',
      keyLength: 32
    })
  };
}

test('autentica com senha e emite par de tokens', async () => {
  await withJwtSecrets(async () => {
    const user = createUser();

    const result = await authenticateWithPassword([user], {
      identifier: user.email,
      password: 'SenhaForte@123',
      audience: 'group-app'
    });

    assert.equal(result.user.id, user.id);
    assert.equal(result.user.passwordHash, undefined);
    assert.equal(result.session.audience, 'group-app');
    assert.equal(typeof result.tokens.accessToken, 'string');
    assert.equal(typeof result.tokens.refreshToken, 'string');
  });
});

test('refresh rotaciona token e invalida refresh anterior', async () => {
  await withJwtSecrets(async () => {
    const user = createUser();

    const login = await authenticateWithPassword([user], {
      identifier: user.username,
      password: 'SenhaForte@123'
    });

    const rotated = await refreshAuthSession([user], login.tokens.refreshToken);
    assert.notEqual(rotated.tokens.refreshToken, login.tokens.refreshToken);

    await assert.rejects(
      async () => refreshAuthSession([user], login.tokens.refreshToken),
      (error) => error?.code === AUTH_ERROR_CODES.REFRESH_REVOKED && error?.status === 401
    );
  });
});
