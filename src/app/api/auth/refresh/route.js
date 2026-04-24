import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAMES,
  AUTH_ERROR_CODES,
  assertJwtSecretConfigured,
  buildAuthCookiePayload,
  createAuthSuccessPayload,
  isAuthConfigMissingError,
  isAuthError,
  logAuthTechnicalEvent,
  refreshAuthSession,
  toAuthErrorResponse
} from '../../../../lib/auth/index.js';
import {
  logBusinessEvent,
  logRequestFailed,
  logRequestSucceeded,
  startMonitoringContext
} from '../../../../lib/api/monitoring.js';
import {
  buildRateLimitErrorPayload,
  buildRateLimitResponseInit,
  buildRefreshRateLimitKey,
  enforceRateLimit,
  getRateLimitPolicy
} from '../../../../lib/api/rateLimit.js';
import { loadAuthUsers } from '../../../../lib/auth/userSource.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function setAuthCookies(response, cookies) {
  for (const cookie of cookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request) {
  const monitoringContext = startMonitoringContext({
    request,
    route: '/api/auth/refresh',
    method: 'POST'
  });

  try {
    assertJwtSecretConfigured();
    const body = await readJsonBody(request);
    const requestId = monitoringContext.requestId;
    const refreshToken =
      request.cookies?.get(AUTH_COOKIE_NAMES.refreshToken)?.value ||
      body?.refreshToken ||
      body?.token ||
      '';

    const rateLimitResult = enforceRateLimit({
      policy: getRateLimitPolicy('authRefresh'),
      key: buildRefreshRateLimitKey(request, body),
      request,
      route: '/api/auth/refresh',
      method: 'POST',
      requestId
    });

    if (!rateLimitResult.allowed) {
      logRequestFailed(monitoringContext, {
        status: rateLimitResult.status || 429,
        domain: 'auth',
        severity: 'warn',
        metadata: { code: rateLimitResult.errorCode || 'RATE_LIMITED' }
      });
      return NextResponse.json(
        buildRateLimitErrorPayload(rateLimitResult),
        buildRateLimitResponseInit(rateLimitResult)
      );
    }

    const authUsers = await loadAuthUsers();
    const result = await refreshAuthSession(authUsers, refreshToken);
    const response = NextResponse.json(createAuthSuccessPayload(result.user, result.session));

    setAuthCookies(response, buildAuthCookiePayload(result.tokens));
    logBusinessEvent(monitoringContext, {
      event: 'session_refreshed',
      domain: 'auth',
      metadata: {
        userId: result.user.id,
        audience: result.session.audience
      }
    });
    logRequestSucceeded(monitoringContext, {
      status: 200,
      domain: 'auth'
    });
    return response;
  } catch (error) {
    if (isAuthConfigMissingError(error)) {
      logAuthTechnicalEvent('auth_config_invalid', {
        route: '/api/auth/refresh',
        method: 'POST',
        requestId: monitoringContext.requestId,
        status: 503,
        code: error.code,
        missing: error?.details?.missing || null
      });
      logRequestFailed(monitoringContext, {
        status: 503,
        domain: 'auth',
        metadata: { code: error.code }
      });
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (isAuthError(error)) {
      logRequestFailed(monitoringContext, {
        status: error?.status || 401,
        domain: 'auth',
        severity: 'warn',
        metadata: { code: error?.code || AUTH_ERROR_CODES.TOKEN_INVALID }
      });
      return toAuthErrorResponse(NextResponse.json, error);
    }

    logRequestFailed(monitoringContext, {
      status: 401,
      domain: 'auth',
      severity: 'warn',
      metadata: { code: AUTH_ERROR_CODES.TOKEN_INVALID }
    });
    return NextResponse.json(
      {
        error: {
          code: AUTH_ERROR_CODES.TOKEN_INVALID,
          message: 'Token de autenticacao invalido.'
        }
      },
      { status: 401 }
    );
  }
}
