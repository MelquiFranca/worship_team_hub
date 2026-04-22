import { AUTH_COOKIE_NAMES } from '../auth/constants.js';

const GLOBAL_STORE_KEY = '__escalasRateLimitStore';
const GLOBAL_METRICS_KEY = '__escalasRateLimitMetrics';

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

const RATE_LIMIT_POLICIES = Object.freeze({
  authLogin: Object.freeze({
    id: 'auth.login',
    route: '/api/auth/login',
    method: 'POST',
    limitEnv: 'RATE_LIMIT_AUTH_LOGIN_MAX',
    windowEnv: 'RATE_LIMIT_AUTH_LOGIN_WINDOW_SECONDS',
    defaultLimit: 5,
    defaultWindowSeconds: 60,
    errorCode: 'AUTH_RATE_LIMITED',
    errorMessage: 'Muitas tentativas de autenticacao. Aguarde e tente novamente.',
    failMode: 'closed',
    category: 'auth'
  }),
  authRefresh: Object.freeze({
    id: 'auth.refresh',
    route: '/api/auth/refresh',
    method: 'POST',
    limitEnv: 'RATE_LIMIT_AUTH_REFRESH_MAX',
    windowEnv: 'RATE_LIMIT_AUTH_REFRESH_WINDOW_SECONDS',
    defaultLimit: 12,
    defaultWindowSeconds: 60,
    errorCode: 'AUTH_REFRESH_RATE_LIMITED',
    errorMessage: 'Muitas tentativas de renovacao de sessao. Aguarde e tente novamente.',
    failMode: 'closed',
    category: 'auth'
  }),
  youtubeSearch: Object.freeze({
    id: 'integration.youtube.search',
    route: '/api/youtube/search',
    method: 'GET',
    limitEnv: 'RATE_LIMIT_YOUTUBE_SEARCH_MAX',
    windowEnv: 'RATE_LIMIT_YOUTUBE_SEARCH_WINDOW_SECONDS',
    defaultLimit: 30,
    defaultWindowSeconds: 60,
    errorCode: 'INTEGRATION_RATE_LIMITED',
    errorMessage: 'Muitas requisicoes para integracao externa. Aguarde e tente novamente.',
    failMode: 'open',
    category: 'integration'
  }),
  youtubePreview: Object.freeze({
    id: 'integration.youtube.preview',
    route: '/api/youtube/preview',
    method: 'GET',
    limitEnv: 'RATE_LIMIT_YOUTUBE_PREVIEW_MAX',
    windowEnv: 'RATE_LIMIT_YOUTUBE_PREVIEW_WINDOW_SECONDS',
    defaultLimit: 40,
    defaultWindowSeconds: 60,
    errorCode: 'INTEGRATION_RATE_LIMITED',
    errorMessage: 'Muitas requisicoes para integracao externa. Aguarde e tente novamente.',
    failMode: 'open',
    category: 'integration'
  })
});

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseBooleanEnv(value, fallback) {
  const normalized = normalizeString(value).toLowerCase();

  if (!normalized) {
    return fallback;
  }

  return TRUE_VALUES.has(normalized);
}

function parsePositiveInteger(value, fallback) {
  const normalized = normalizeString(value);

  if (!normalized || !/^\d+$/.test(normalized)) {
    return fallback;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function fnv1a32(input) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

function toStableHash(value) {
  const normalized = normalizeString(String(value || ''));
  return fnv1a32(normalized || 'empty');
}

function getBearerToken(request) {
  const authorization = normalizeString(request.headers?.get('authorization'));

  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return '';
  }

  return normalizeString(authorization.slice(7));
}

function getAuthSessionFingerprint(request) {
  const accessCookie =
    normalizeString(request.cookies?.get(AUTH_COOKIE_NAMES.accessToken)?.value) ||
    normalizeString(request.cookies?.get('access_token')?.value) ||
    normalizeString(request.cookies?.get('auth_token')?.value);

  const bearerToken = getBearerToken(request);
  return accessCookie || bearerToken || 'anonymous';
}

function resolveRequestId(request) {
  return (
    normalizeString(request.headers?.get('x-request-id')) ||
    normalizeString(request.headers?.get('x-correlation-id')) ||
    null
  );
}

export function resolveClientIp(request) {
  const forwarded = normalizeString(request.headers?.get('x-forwarded-for'));

  if (forwarded) {
    const firstForwarded = normalizeString(forwarded.split(',')[0]);

    if (firstForwarded) {
      return firstForwarded;
    }
  }

  const realIp = normalizeString(request.headers?.get('x-real-ip'));

  if (realIp) {
    return realIp;
  }

  const requestIp = normalizeString(request.ip);
  return requestIp || '0.0.0.0';
}

export function buildLoginRateLimitKey(request, body) {
  const ip = resolveClientIp(request);
  const identifier = normalizeString(body?.identifier).toLowerCase();

  if (!identifier) {
    return `login:${ip}:anonymous`;
  }

  return `login:${ip}:${toStableHash(identifier)}`;
}

export function buildRefreshRateLimitKey(request, body) {
  const ip = resolveClientIp(request);
  const refreshToken =
    normalizeString(request.cookies?.get(AUTH_COOKIE_NAMES.refreshToken)?.value) ||
    normalizeString(body?.refreshToken) ||
    normalizeString(body?.token);

  if (!refreshToken) {
    return `refresh:${ip}:anonymous`;
  }

  return `refresh:${ip}:${toStableHash(refreshToken)}`;
}

export function buildIntegrationRateLimitKey(request) {
  const ip = resolveClientIp(request);
  const sessionFingerprint = getAuthSessionFingerprint(request);
  return `integration:${ip}:${toStableHash(sessionFingerprint)}`;
}

function getGlobalMetricsMap() {
  if (!globalThis[GLOBAL_METRICS_KEY]) {
    globalThis[GLOBAL_METRICS_KEY] = new Map();
  }

  return globalThis[GLOBAL_METRICS_KEY];
}

function recordMetric(policyId, field) {
  const metrics = getGlobalMetricsMap();
  const current = metrics.get(policyId) || {
    allowed: 0,
    blocked: 0,
    failOpenAllowed: 0,
    storeErrors: 0
  };

  current[field] = (current[field] || 0) + 1;
  metrics.set(policyId, current);
}

function logRateLimitEvent(level, payload, logger = console) {
  const line = JSON.stringify({
    domain: 'rate_limit',
    timestamp: new Date().toISOString(),
    ...payload
  });

  if (level === 'error' && typeof logger.error === 'function') {
    logger.error(line);
    return;
  }

  if (level === 'warn' && typeof logger.warn === 'function') {
    logger.warn(line);
    return;
  }

  if (typeof logger.info === 'function') {
    logger.info(line);
    return;
  }

  logger.log(line);
}

function shouldForceStoreFailure(env = process.env) {
  return parseBooleanEnv(env.RATE_LIMIT_STORE_FORCE_FAILURE, false);
}

function createInMemoryRateLimitStore() {
  const windows = new Map();
  let operationCount = 0;

  function pruneExpired(nowMs) {
    if (windows.size < 500 || operationCount % 250 !== 0) {
      return;
    }

    for (const [key, value] of windows.entries()) {
      if (value.resetAtMs <= nowMs) {
        windows.delete(key);
      }
    }
  }

  return {
    increment({ policyId, key, windowMs, nowMs, env = process.env }) {
      if (shouldForceStoreFailure(env)) {
        throw new Error('rate-limit-store-unavailable');
      }

      operationCount += 1;
      pruneExpired(nowMs);

      const bucketKey = `${policyId}:${key}`;
      const current = windows.get(bucketKey);

      if (!current || current.resetAtMs <= nowMs) {
        const resetAtMs = nowMs + windowMs;
        windows.set(bucketKey, {
          count: 1,
          resetAtMs
        });

        return {
          count: 1,
          resetAtMs
        };
      }

      current.count += 1;
      windows.set(bucketKey, current);

      return {
        count: current.count,
        resetAtMs: current.resetAtMs
      };
    },
    clear() {
      windows.clear();
      operationCount = 0;
    }
  };
}

function getDefaultStore() {
  if (!globalThis[GLOBAL_STORE_KEY]) {
    globalThis[GLOBAL_STORE_KEY] = createInMemoryRateLimitStore();
  }

  return globalThis[GLOBAL_STORE_KEY];
}

export function getRateLimitPolicy(policyName, env = process.env) {
  const definition = RATE_LIMIT_POLICIES[policyName];

  if (!definition) {
    return null;
  }

  const enabledGlobal = parseBooleanEnv(env.RATE_LIMIT_ENABLED, true);
  const enabledAuth = parseBooleanEnv(env.RATE_LIMIT_AUTH_ENABLED, true);
  const enabledIntegrations = parseBooleanEnv(env.RATE_LIMIT_INTEGRATIONS_ENABLED, true);

  const enabledCategory =
    definition.category === 'auth'
      ? enabledAuth
      : definition.category === 'integration'
        ? enabledIntegrations
        : true;

  return {
    ...definition,
    enabled: enabledGlobal && enabledCategory,
    limit: parsePositiveInteger(env[definition.limitEnv], definition.defaultLimit),
    windowSeconds: parsePositiveInteger(env[definition.windowEnv], definition.defaultWindowSeconds)
  };
}

export function buildRateLimitErrorPayload(result) {
  return {
    error: {
      code: result.errorCode,
      message: result.errorMessage
    }
  };
}

export function buildRateLimitResponseInit(result) {
  const headers = {};

  if (result.retryAfterSeconds && Number.isFinite(result.retryAfterSeconds)) {
    headers['Retry-After'] = String(result.retryAfterSeconds);
  }

  return {
    status: result.status,
    headers
  };
}

export function enforceRateLimit(options = {}) {
  const {
    policy,
    key,
    request,
    method,
    route,
    requestId = resolveRequestId(request),
    store = getDefaultStore(),
    logger = console,
    env = process.env,
    nowMs = Date.now()
  } = options;

  if (!policy || !policy.enabled) {
    return { allowed: true };
  }

  const keyHash = toStableHash(key);

  try {
    const windowMs = policy.windowSeconds * 1000;
    const result = store.increment({
      policyId: policy.id,
      key,
      windowMs,
      nowMs,
      env
    });

    const isAllowed = result.count <= policy.limit;

    if (isAllowed) {
      recordMetric(policy.id, 'allowed');
      return {
        allowed: true,
        remaining: Math.max(policy.limit - result.count, 0),
        resetAtMs: result.resetAtMs
      };
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAtMs - nowMs) / 1000));
    recordMetric(policy.id, 'blocked');

    logRateLimitEvent(
      'warn',
      {
        event: 'rate_limit_blocked',
        policyId: policy.id,
        route: route || policy.route,
        method: method || policy.method,
        requestId,
        keyHash,
        limit: policy.limit,
        windowSeconds: policy.windowSeconds,
        retryAfterSeconds
      },
      logger
    );

    return {
      allowed: false,
      status: 429,
      errorCode: policy.errorCode,
      errorMessage: policy.errorMessage,
      retryAfterSeconds
    };
  } catch (error) {
    recordMetric(policy.id, 'storeErrors');

    const basePayload = {
      event: 'rate_limit_store_failure',
      policyId: policy.id,
      route: route || policy.route,
      method: method || policy.method,
      requestId,
      keyHash,
      message: error?.message || 'unknown-store-error'
    };

    if (policy.failMode === 'open') {
      recordMetric(policy.id, 'failOpenAllowed');
      logRateLimitEvent('warn', { ...basePayload, mode: 'fail_open' }, logger);
      return {
        allowed: true,
        degraded: true
      };
    }

    logRateLimitEvent('error', { ...basePayload, mode: 'fail_closed' }, logger);
    return {
      allowed: false,
      status: 503,
      errorCode: 'RATE_LIMIT_UNAVAILABLE',
      errorMessage: 'Servico temporariamente indisponivel. Tente novamente em instantes.',
      retryAfterSeconds: 5
    };
  }
}

export function getRateLimitMetricsSnapshot() {
  return Object.fromEntries(getGlobalMetricsMap().entries());
}

export function resetRateLimitRuntimeState() {
  const store = getDefaultStore();

  if (typeof store.clear === 'function') {
    store.clear();
  }

  getGlobalMetricsMap().clear();
}
