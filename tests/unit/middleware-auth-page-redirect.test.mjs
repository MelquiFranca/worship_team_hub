import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAuthFailureResponse, middleware } from '../../src/middleware.js';

const SECRET_ENV_KEYS = [
  'AUTH_JWT_SECRET',
  'JWT_SECRET',
  'AUTH_SECRET',
  'SESSION_SECRET',
  'NEXTAUTH_SECRET',
  'AUTH_JWT_PUBLIC_KEY',
  'JWT_PUBLIC_KEY',
  'AUTH_PUBLIC_KEY'
];

function createRequest(pathname, options = {}) {
  const { cookies = [] } = options;
  const cookieMap = new Map(cookies.map((cookie) => [cookie.name, cookie.value]));

  return {
    url: `https://example.com${pathname}`,
    nextUrl: { pathname },
    cookies: {
      get(name) {
        const value = cookieMap.get(name);
        return typeof value === 'string' ? { name, value } : undefined;
      },
      getAll() {
        return cookies.map((cookie) => ({
          name: cookie.name,
          value: cookie.value
        }));
      }
    }
  };
}

async function withJwtConfig(value, callback) {
  const previous = Object.fromEntries(
    SECRET_ENV_KEYS.map((key) => [key, process.env[key]])
  );

  SECRET_ENV_KEYS.forEach((key) => {
    delete process.env[key];
  });

  if (typeof value === 'string') {
    process.env.AUTH_JWT_SECRET = value;
    process.env.JWT_SECRET = value;
  }

  try {
    await callback();
  } finally {
    SECRET_ENV_KEYS.forEach((key) => {
      if (typeof previous[key] === 'string') {
        process.env[key] = previous[key];
        return;
      }

      delete process.env[key];
    });
  }
}

test('middleware redireciona rota protegida app para /login quando token ausente', async () => {
  await withJwtConfig('segredo-de-teste-com-32-caracteres-1234', async () => {
    const response = await middleware(createRequest('/escalas'));
    assert.equal(response.status, 307);
    assert.equal(response.headers.get('location'), 'https://example.com/login');
  });
});

test('middleware redireciona rota protegida admin para /admin/login quando token ausente', async () => {
  await withJwtConfig('segredo-de-teste-com-32-caracteres-1234', async () => {
    const response = await middleware(createRequest('/admin/grupos'));
    assert.equal(response.status, 307);
    assert.equal(response.headers.get('location'), 'https://example.com/admin/login');
  });
});

test('resolvedor de falha preserva resposta JSON para contexto de API', async () => {
  const response = buildAuthFailureResponse(
    'AUTH_TOKEN_MISSING',
    createRequest('/api/demo'),
    { loginPath: '/login' }
  );

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload?.error?.code, 'AUTH_TOKEN_MISSING');
});

test('middleware mantem resposta tecnica AUTH_CONFIG_MISSING sem redirect', async () => {
  await withJwtConfig(undefined, async () => {
    const response = await middleware(createRequest('/escalas'));
    assert.equal(response.status, 503);
    const payload = await response.json();
    assert.equal(payload?.error?.code, 'AUTH_CONFIG_MISSING');
  });
});
