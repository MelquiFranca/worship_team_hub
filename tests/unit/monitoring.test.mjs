import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isMonitoringLogsEnabled,
  logBusinessEvent,
  logMonitoringEvent,
  logRequestFailed,
  logRequestSucceeded,
  resolveRequestId,
  sanitizeMonitoringPayload,
  startMonitoringContext
} from '../../src/lib/api/monitoring.js';

function createRequest({ headers = {}, method = 'POST', route = '/api/test' } = {}) {
  return {
    method,
    nextUrl: { pathname: route },
    headers: {
      get(name) {
        return headers[name.toLowerCase()] ?? headers[name] ?? null;
      }
    }
  };
}

function captureConsole() {
  const original = {
    info: console.info,
    warn: console.warn,
    error: console.error
  };

  const calls = [];

  console.info = (message) => calls.push({ level: 'info', payload: JSON.parse(message) });
  console.warn = (message) => calls.push({ level: 'warn', payload: JSON.parse(message) });
  console.error = (message) => calls.push({ level: 'error', payload: JSON.parse(message) });

  return {
    calls,
    restore() {
      console.info = original.info;
      console.warn = original.warn;
      console.error = original.error;
    }
  };
}

test('emite contrato estruturado com campos obrigatorios e severidade info', () => {
  const logger = captureConsole();

  try {
    const entry = logMonitoringEvent({
      severity: 'info',
      event: 'request_succeeded',
      requestId: 'req-123',
      route: '/api/auth/login',
      method: 'post',
      status: 200,
      durationMs: 18,
      domain: 'auth',
      metadata: { attempt: 1 }
    });

    assert.equal(logger.calls.length, 1);
    assert.equal(logger.calls[0].level, 'info');
    assert.equal(entry.severity, 'info');

    const payload = logger.calls[0].payload;

    assert.equal(payload.event, 'request_succeeded');
    assert.equal(payload.requestId, 'req-123');
    assert.equal(payload.route, '/api/auth/login');
    assert.equal(payload.method, 'POST');
    assert.equal(payload.status, 200);
    assert.equal(payload.durationMs, 18);
    assert.equal(payload.domain, 'auth');
    assert.equal(payload.metadata.attempt, 1);
    assert.match(payload.timestamp, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    logger.restore();
  }
});

test('resolve requestId por header e gera fallback quando ausente', () => {
  const fromHeader = resolveRequestId(
    createRequest({ headers: { 'x-request-id': 'abc-123' } })
  );

  const fallback = resolveRequestId(createRequest());

  assert.equal(fromHeader, 'abc-123');
  assert.match(
    fallback,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  );
});

test('feature flag MONITORING_LOGS_ENABLED desabilita emissao', () => {
  const logger = captureConsole();

  try {
    const entry = logMonitoringEvent({
      event: 'request_succeeded',
      requestId: 'req-1',
      route: '/api/demo',
      method: 'GET',
      status: 200,
      durationMs: 10,
      env: { MONITORING_LOGS_ENABLED: 'false' }
    });

    assert.equal(isMonitoringLogsEnabled({ MONITORING_LOGS_ENABLED: undefined }), true);
    assert.equal(isMonitoringLogsEnabled({ MONITORING_LOGS_ENABLED: '0' }), false);
    assert.equal(entry, null);
    assert.equal(logger.calls.length, 0);
  } finally {
    logger.restore();
  }
});

test('sanitiza chaves e valores sensiveis em profundidade limitada', () => {
  const sanitized = sanitizeMonitoringPayload({
    password: '123456',
    user: {
      token: 'abc',
      nested: {
        authorization: 'Bearer TOP_SECRET',
        payload: 'cookie=session=123',
        ok: true
      }
    },
    metadata: ['ok', 'Bearer very-secret-token']
  });

  assert.equal(sanitized.password, '[REDACTED]');
  assert.equal(sanitized.user.token, '[REDACTED]');
  assert.equal(sanitized.user.nested.authorization, '[REDACTED]');
  assert.equal(sanitized.user.nested.payload, '[REDACTED]');
  assert.equal(sanitized.metadata[1], '[REDACTED]');
  assert.equal(sanitized.user.nested.ok, true);
});

test('API utilitaria de contexto emite request_succeeded, request_failed e evento de negocio com severidades corretas', () => {
  const logger = captureConsole();

  try {
    const context = startMonitoringContext({
      request: createRequest({
        route: '/api/components',
        method: 'PATCH',
        headers: { 'x-correlation-id': 'corr-9' }
      }),
      now: () => 100,
      env: { MONITORING_LOGS_ENABLED: 'true' }
    });

    logRequestSucceeded(context, {
      status: 204,
      domain: 'components',
      metadata: { message: 'Bearer should be hidden' },
      now: () => 160
    });

    logRequestFailed(context, {
      status: 500,
      severity: 'error',
      domain: 'components',
      metadata: { secret: 'value' },
      now: () => 190
    });

    logBusinessEvent(context, {
      event: 'component_changed',
      severity: 'warn',
      status: 202,
      domain: 'components',
      metadata: { authorization: 'Bearer xyz' }
    });

    assert.equal(logger.calls.length, 3);

    const [success, failure, business] = logger.calls;

    assert.equal(success.level, 'info');
    assert.equal(success.payload.event, 'request_succeeded');
    assert.equal(success.payload.requestId, 'corr-9');
    assert.equal(success.payload.durationMs, 60);
    assert.equal(success.payload.metadata.message, '[REDACTED]');

    assert.equal(failure.level, 'error');
    assert.equal(failure.payload.event, 'request_failed');
    assert.equal(failure.payload.durationMs, 90);
    assert.equal(failure.payload.metadata.secret, '[REDACTED]');

    assert.equal(business.level, 'warn');
    assert.equal(business.payload.event, 'component_changed');
    assert.equal(business.payload.status, 202);
    assert.equal(business.payload.metadata.authorization, '[REDACTED]');
  } finally {
    logger.restore();
  }
});
