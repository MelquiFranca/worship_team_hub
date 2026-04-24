import crypto from 'node:crypto';

const DEFAULT_EVENT = 'monitoring_event';
const DEFAULT_ROUTE = 'unknown_route';
const DEFAULT_METHOD = 'UNKNOWN';
const REDACTED_VALUE = '[REDACTED]';
const MAX_SANITIZE_DEPTH = 5;
const MAX_SANITIZE_ARRAY_LENGTH = 50;

const SENSITIVE_KEY_PATTERN = /(password|passwd|pwd|token|secret|authorization|cookie)/i;
const SENSITIVE_VALUE_PATTERN = /(bearer\s+|token|secret|password|passwd|authorization|cookie|set-cookie)/i;

function normalizeString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function isMonitoringLogsEnabled(env = process.env) {
  const raw = normalizeString(env?.MONITORING_LOGS_ENABLED);

  if (!raw) {
    return true;
  }

  const normalized = raw.toLowerCase();
  return !['0', 'false', 'off', 'no', 'disabled'].includes(normalized);
}

export function resolveRequestId(request) {
  return (
    normalizeString(request?.headers?.get?.('x-request-id')) ||
    normalizeString(request?.headers?.get?.('x-correlation-id')) ||
    crypto.randomUUID()
  );
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function isSensitiveKey(key) {
  return SENSITIVE_KEY_PATTERN.test(String(key));
}

function isSensitiveStringValue(value) {
  return SENSITIVE_VALUE_PATTERN.test(String(value));
}

function sanitizeInternal(value, depth, seen) {
  if (value == null) {
    return value;
  }

  if (depth >= MAX_SANITIZE_DEPTH) {
    return '[Truncated]';
  }

  if (typeof value === 'string') {
    return isSensitiveStringValue(value) ? REDACTED_VALUE : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'bigint') {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'function') {
    return '[Function]';
  }

  if (typeof value !== 'object') {
    return String(value);
  }

  if (seen.has(value)) {
    return '[Circular]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    const limited = value.slice(0, MAX_SANITIZE_ARRAY_LENGTH);
    return limited.map((item) => sanitizeInternal(item, depth + 1, seen));
  }

  if (!isPlainObject(value)) {
    return String(value);
  }

  const output = {};

  for (const [key, item] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      output[key] = REDACTED_VALUE;
      continue;
    }

    output[key] = sanitizeInternal(item, depth + 1, seen);
  }

  return output;
}

export function sanitizeMonitoringPayload(payload) {
  return sanitizeInternal(payload, 0, new WeakSet());
}

function buildBaseEntry({
  event,
  requestId,
  route,
  method,
  status,
  durationMs,
  domain,
  metadata,
  timestamp
}) {
  return {
    event: normalizeString(event) || DEFAULT_EVENT,
    timestamp: timestamp || new Date().toISOString(),
    requestId: normalizeString(requestId) || crypto.randomUUID(),
    route: normalizeString(route) || DEFAULT_ROUTE,
    method: normalizeString(method)?.toUpperCase() || DEFAULT_METHOD,
    status: Number.isFinite(status) ? status : null,
    durationMs: Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs)) : null,
    domain: normalizeString(domain) || null,
    metadata: metadata == null ? null : sanitizeMonitoringPayload(metadata)
  };
}

function emitStructuredLog(severity, entry, { env = process.env } = {}) {
  if (!isMonitoringLogsEnabled(env)) {
    return null;
  }

  const payload = { severity, ...entry };

  try {
    const serialized = JSON.stringify(payload);

    if (severity === 'error') {
      console.error(serialized);
    } else if (severity === 'warn') {
      console.warn(serialized);
    } else {
      console.info(serialized);
    }

    return payload;
  } catch (error) {
    const fallback = {
      severity: 'error',
      event: 'monitoring_logging_failed',
      timestamp: new Date().toISOString(),
      requestId: entry.requestId,
      route: entry.route,
      method: entry.method,
      status: entry.status,
      durationMs: entry.durationMs,
      domain: 'monitoring',
      metadata: {
        reason: 'serialization_failed',
        message: error instanceof Error ? error.message : String(error)
      }
    };

    console.error(JSON.stringify(fallback));
    return fallback;
  }
}

export function logMonitoringEvent({
  severity = 'info',
  event,
  requestId,
  route,
  method,
  status,
  durationMs,
  domain,
  metadata,
  timestamp,
  env
} = {}) {
  const normalizedSeverity = ['info', 'warn', 'error'].includes(severity) ? severity : 'info';
  const entry = buildBaseEntry({
    event,
    requestId,
    route,
    method,
    status,
    durationMs,
    domain,
    metadata,
    timestamp
  });

  return emitStructuredLog(normalizedSeverity, entry, { env });
}

export function startMonitoringContext({ request, route, method, now = Date.now, env } = {}) {
  const startedAtMs = now();
  const requestId = resolveRequestId(request);
  const resolvedMethod = normalizeString(method) || normalizeString(request?.method) || DEFAULT_METHOD;

  return {
    requestId,
    route: normalizeString(route) || normalizeString(request?.nextUrl?.pathname) || DEFAULT_ROUTE,
    method: resolvedMethod.toUpperCase(),
    startedAtMs,
    env
  };
}

function resolveDurationMs(context, now = Date.now, explicitDurationMs) {
  if (Number.isFinite(explicitDurationMs)) {
    return explicitDurationMs;
  }

  const current = now();
  return current - context.startedAtMs;
}

export function logRequestSucceeded(context, { status = 200, domain, metadata, durationMs, now = Date.now } = {}) {
  return logMonitoringEvent({
    severity: 'info',
    event: 'request_succeeded',
    requestId: context?.requestId,
    route: context?.route,
    method: context?.method,
    status,
    durationMs: resolveDurationMs(context, now, durationMs),
    domain,
    metadata,
    env: context?.env
  });
}

export function logRequestFailed(context, {
  status = 500,
  domain,
  metadata,
  durationMs,
  now = Date.now,
  severity = 'error'
} = {}) {
  return logMonitoringEvent({
    severity: severity === 'warn' ? 'warn' : 'error',
    event: 'request_failed',
    requestId: context?.requestId,
    route: context?.route,
    method: context?.method,
    status,
    durationMs: resolveDurationMs(context, now, durationMs),
    domain,
    metadata,
    env: context?.env
  });
}

export function logBusinessEvent(context, {
  event,
  severity = 'info',
  status = null,
  domain,
  metadata,
  durationMs = 0
} = {}) {
  return logMonitoringEvent({
    severity,
    event,
    requestId: context?.requestId,
    route: context?.route,
    method: context?.method,
    status,
    durationMs,
    domain,
    metadata,
    env: context?.env
  });
}
