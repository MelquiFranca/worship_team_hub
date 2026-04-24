import { NextResponse } from 'next/server';
import {
  AUTH_ERROR_CODES,
  assertJwtSecretConfigured,
  authenticateWithPassword,
  buildAuthCookiePayload,
  createAuthSuccessPayload,
  isAuthConfigMissingError,
  isAuthError,
  logAuthTechnicalEvent,
  toAuthErrorResponse
} from '../../../../lib/auth/index.js';
import {
  logBusinessEvent,
  logRequestFailed,
  logRequestSucceeded,
  startMonitoringContext
} from '../../../../lib/api/monitoring.js';
import {
  buildLoginRateLimitKey,
  buildRateLimitErrorPayload,
  buildRateLimitResponseInit,
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
    route: '/api/auth/login',
    method: 'POST'
  });

  try {
    assertJwtSecretConfigured();
    const body = await readJsonBody(request);
    const requestId = monitoringContext.requestId;

    if (!body || typeof body !== 'object') {
      logRequestFailed(monitoringContext, {
        status: 400,
        domain: 'auth',
        severity: 'warn',
        metadata: { code: AUTH_ERROR_CODES.REQUEST_INVALID }
      });
      return NextResponse.json(
        {
          error: {
            code: AUTH_ERROR_CODES.REQUEST_INVALID,
            message: 'A requisicao de autenticacao e invalida.'
          }
        },
        { status: 400 }
      );
    }

    const rateLimitResult = enforceRateLimit({
      policy: getRateLimitPolicy('authLogin'),
      key: buildLoginRateLimitKey(request, body),
      request,
      route: '/api/auth/login',
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
    const result = await authenticateWithPassword(authUsers, body);
    const response = NextResponse.json(createAuthSuccessPayload(result.user, result.session));

    setAuthCookies(response, buildAuthCookiePayload(result.tokens));
    logBusinessEvent(monitoringContext, {
      event: 'login_succeeded',
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
        route: '/api/auth/login',
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
      logBusinessEvent(monitoringContext, {
        event: 'login_failed',
        severity: 'warn',
        status: error?.status || 401,
        domain: 'auth',
        metadata: { code: error?.code || AUTH_ERROR_CODES.CREDENTIALS_INVALID }
      });
      logRequestFailed(monitoringContext, {
        status: error?.status || 401,
        domain: 'auth',
        severity: 'warn',
        metadata: { code: error?.code || AUTH_ERROR_CODES.CREDENTIALS_INVALID }
      });
      return toAuthErrorResponse(NextResponse.json, error);
    }

    logRequestFailed(monitoringContext, {
      status: 400,
      domain: 'auth',
      severity: 'warn',
      metadata: { code: AUTH_ERROR_CODES.REQUEST_INVALID }
    });
    return NextResponse.json(
      {
        error: {
          code: AUTH_ERROR_CODES.REQUEST_INVALID,
          message: 'A requisicao de autenticacao e invalida.'
        }
      },
      { status: 400 }
    );
  }
}
