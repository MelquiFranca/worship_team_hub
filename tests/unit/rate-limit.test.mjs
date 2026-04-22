import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildIntegrationRateLimitKey,
  buildLoginRateLimitKey,
  buildRateLimitErrorPayload,
  buildRateLimitResponseInit,
  buildRefreshRateLimitKey,
  enforceRateLimit,
  getRateLimitMetricsSnapshot,
  getRateLimitPolicy,
  resetRateLimitRuntimeState
} from '../../src/lib/api/rateLimit.js';

function createRequest({
  ip = '127.0.0.1',
  headers = {},
  cookies = {}
} = {}) {
  return {
    ip,
    headers: {
      get(name) {
        return headers[name.toLowerCase()] ?? headers[name] ?? null;
      }
    },
    cookies: {
      get(name) {
        const value = cookies[name];

        if (typeof value !== 'string') {
          return undefined;
        }

        return { value };
      }
    }
  };
}

test('gera chave de login com identificador normalizado e fallback quando ausente', () => {
  const request = createRequest({
    headers: {
      'x-forwarded-for': '203.0.113.21, 10.0.0.2'
    }
  });

  const withIdentifier = buildLoginRateLimitKey(request, {
    identifier: '  USER@Example.com  '
  });

  const fallback = buildLoginRateLimitKey(request, {});

  assert.match(withIdentifier, /^login:203\.0\.113\.21:[a-f0-9]{8}$/);
  assert.equal(fallback, 'login:203.0.113.21:anonymous');
});

test('gera chave de refresh e integracao com fingerprint sem expor token bruto', () => {
  const request = createRequest({
    ip: '198.51.100.8',
    cookies: {
      escalas_refresh_token: 'refresh-token-secreto',
      escalas_access_token: 'access-token-secreto'
    }
  });

  const refreshKey = buildRefreshRateLimitKey(request, {});
  const integrationKey = buildIntegrationRateLimitKey(request);

  assert.match(refreshKey, /^refresh:198\.51\.100\.8:[a-f0-9]{8}$/);
  assert.match(integrationKey, /^integration:198\.51\.100\.8:[a-f0-9]{8}$/);
  assert.equal(refreshKey.includes('refresh-token-secreto'), false);
  assert.equal(integrationKey.includes('access-token-secreto'), false);
});

test('bloqueia quando excede limite e retorna contrato padrao com Retry-After', () => {
  resetRateLimitRuntimeState();

  const policy = getRateLimitPolicy('authLogin', {
    RATE_LIMIT_ENABLED: 'true',
    RATE_LIMIT_AUTH_ENABLED: 'true',
    RATE_LIMIT_AUTH_LOGIN_MAX: '1',
    RATE_LIMIT_AUTH_LOGIN_WINDOW_SECONDS: '60'
  });

  const request = createRequest({ ip: '127.0.0.1' });

  const first = enforceRateLimit({
    policy,
    key: 'login:127.0.0.1:abc123',
    request,
    nowMs: 0
  });

  const second = enforceRateLimit({
    policy,
    key: 'login:127.0.0.1:abc123',
    request,
    nowMs: 1000
  });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, false);
  assert.equal(second.status, 429);
  assert.equal(second.errorCode, 'AUTH_RATE_LIMITED');

  const payload = buildRateLimitErrorPayload(second);
  const init = buildRateLimitResponseInit(second);

  assert.equal(payload.error.code, 'AUTH_RATE_LIMITED');
  assert.equal(init.status, 429);
  assert.equal(init.headers['Retry-After'], '59');
});

test('aplica fail-closed para auth quando store esta indisponivel', () => {
  resetRateLimitRuntimeState();

  const policy = getRateLimitPolicy('authRefresh', {
    RATE_LIMIT_ENABLED: 'true',
    RATE_LIMIT_AUTH_ENABLED: 'true'
  });

  const request = createRequest({ ip: '192.0.2.50' });
  const blocked = enforceRateLimit({
    policy,
    key: 'refresh:192.0.2.50:abc123',
    request,
    env: {
      RATE_LIMIT_STORE_FORCE_FAILURE: 'true'
    }
  });

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.status, 503);
  assert.equal(blocked.errorCode, 'RATE_LIMIT_UNAVAILABLE');
});

test('aplica fail-open para integracoes quando store esta indisponivel e contabiliza metricas', () => {
  resetRateLimitRuntimeState();

  const policy = getRateLimitPolicy('youtubeSearch', {
    RATE_LIMIT_ENABLED: 'true',
    RATE_LIMIT_INTEGRATIONS_ENABLED: 'true'
  });

  const request = createRequest({ ip: '192.0.2.77' });
  const allowed = enforceRateLimit({
    policy,
    key: 'integration:192.0.2.77:abc123',
    request,
    env: {
      RATE_LIMIT_STORE_FORCE_FAILURE: 'true'
    }
  });

  const snapshot = getRateLimitMetricsSnapshot();

  assert.equal(allowed.allowed, true);
  assert.equal(allowed.degraded, true);
  assert.equal(snapshot['integration.youtube.search'].storeErrors, 1);
  assert.equal(snapshot['integration.youtube.search'].failOpenAllowed, 1);
});
