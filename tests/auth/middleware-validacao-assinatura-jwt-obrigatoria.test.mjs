import assert from 'node:assert/strict';
import test from 'node:test';
import { requireApiAccessSession } from '../../src/lib/api/auth.js';
import { AUTH_COOKIE_NAMES, AUTH_ERROR_CODES, AUTH_ISSUER } from '../../src/lib/auth/index.js';
import { signJwt } from '../../src/lib/auth/jwt.js';

const FIXED_SECRET = 'jwt-secret-para-testes-seguros-1234567890';
const SAMPLE_USER = Object.freeze({
  id: 'user-1',
  role: 'group_owner',
  groupId: 'group-1',
  groupStatus: 'active',
  email: 'owner@example.com',
  username: 'owner'
});

function setJwtSecrets(value) {
  if (typeof value === 'string') {
    process.env.AUTH_JWT_SECRET = value;
    process.env.JWT_SECRET = value;
    return;
  }

  delete process.env.AUTH_JWT_SECRET;
  delete process.env.JWT_SECRET;
}

async function withJwtSecrets(value, callback) {
  const previousAuthSecret = process.env.AUTH_JWT_SECRET;
  const previousJwtSecret = process.env.JWT_SECRET;

  try {
    setJwtSecrets(value);
    return await callback();
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
  }
}

function createAccessToken(overrides = {}, secret = FIXED_SECRET) {
  const now = Math.floor(Date.now() / 1000);

  return signJwt(
    {
      sub: SAMPLE_USER.id,
      aud: 'group-app',
      role: SAMPLE_USER.role,
      groupId: SAMPLE_USER.groupId,
      iat: now - 5,
      exp: now + 300,
      iss: AUTH_ISSUER,
      jti: `jti-${now}`,
      type: 'access',
      ...overrides
    },
    secret
  );
}

function createRequestWithAccessToken(accessToken) {
  return {
    cookies: {
      get(name) {
        if (name === AUTH_COOKIE_NAMES.accessToken && accessToken) {
          return { value: accessToken };
        }

        return undefined;
      }
    }
  };
}

test('autoriza token valido com assinatura correta', async () => {
  await withJwtSecrets(FIXED_SECRET, async () => {
    const token = createAccessToken();
    const request = createRequestWithAccessToken(token);

    const result = await requireApiAccessSession(request, {
      users: [SAMPLE_USER]
    });

    assert.equal(result.user.id, SAMPLE_USER.id);
    assert.equal(result.claims.aud, 'group-app');
    assert.equal(result.claims.role, SAMPLE_USER.role);
  });
});

test('retorna 401 quando token possui assinatura adulterada', async () => {
  await withJwtSecrets(FIXED_SECRET, async () => {
    const validToken = createAccessToken();
    const [header, payload, signature] = validToken.split('.');
    const tamperedSignature = `${signature[0] === 'a' ? 'b' : 'a'}${signature.slice(1)}`;
    const tamperedToken = `${header}.${payload}.${tamperedSignature}`;

    const request = createRequestWithAccessToken(tamperedToken);

    await assert.rejects(
      requireApiAccessSession(request, {
        users: [SAMPLE_USER]
      }),
      (error) => error?.code === AUTH_ERROR_CODES.TOKEN_INVALID && error?.status === 401
    );
  });
});

test('retorna 401 quando token esta expirado', async () => {
  await withJwtSecrets(FIXED_SECRET, async () => {
    const token = createAccessToken({
      exp: Math.floor(Date.now() / 1000) - 1
    });
    const request = createRequestWithAccessToken(token);

    await assert.rejects(
      requireApiAccessSession(request, {
        users: [SAMPLE_USER]
      }),
      (error) => error?.code === AUTH_ERROR_CODES.TOKEN_EXPIRED && error?.status === 401
    );
  });
});

test('retorna 401 quando token e malformado', async () => {
  await withJwtSecrets(FIXED_SECRET, async () => {
    const request = createRequestWithAccessToken('token-malformado-sem-tres-partes');

    await assert.rejects(
      requireApiAccessSession(request, {
        users: [SAMPLE_USER]
      }),
      (error) => error?.code === AUTH_ERROR_CODES.TOKEN_MALFORMED && error?.status === 401
    );
  });
});

test('retorna 503 quando segredo/chave JWT esta ausente', async () => {
  await withJwtSecrets(undefined, async () => {
    const token = createAccessToken({}, FIXED_SECRET);
    const request = createRequestWithAccessToken(token);

    await assert.rejects(
      requireApiAccessSession(request, {
        users: [SAMPLE_USER]
      }),
      (error) => error?.code === AUTH_ERROR_CODES.CONFIG_MISSING && error?.status === 503
    );
  });
});

test('nao permite bypass historico sem segredo, mesmo com token aparentemente valido', async () => {
  await withJwtSecrets(undefined, async () => {
    const token = createAccessToken({}, FIXED_SECRET);
    const request = createRequestWithAccessToken(token);

    await assert.rejects(
      requireApiAccessSession(request, {
        users: [SAMPLE_USER]
      }),
      (error) => error?.code === AUTH_ERROR_CODES.CONFIG_MISSING && error?.status === 503
    );
  });
});
