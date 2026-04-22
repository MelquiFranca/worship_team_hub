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

function resolveRequestId(request) {
  return (
    request.headers?.get('x-request-id') ||
    request.headers?.get('x-correlation-id') ||
    null
  );
}

export async function POST(request) {
  try {
    assertJwtSecretConfigured();
    const body = await readJsonBody(request);
    const requestId = resolveRequestId(request);

    if (!body || typeof body !== 'object') {
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
      return NextResponse.json(
        buildRateLimitErrorPayload(rateLimitResult),
        buildRateLimitResponseInit(rateLimitResult)
      );
    }

    const authUsers = await loadAuthUsers();
    const result = await authenticateWithPassword(authUsers, body);
    const response = NextResponse.json(createAuthSuccessPayload(result.user, result.session));

    setAuthCookies(response, buildAuthCookiePayload(result.tokens));
    return response;
  } catch (error) {
    if (isAuthConfigMissingError(error)) {
      logAuthTechnicalEvent('auth_config_invalid', {
        route: '/api/auth/login',
        method: 'POST',
        requestId: resolveRequestId(request),
        status: 503,
        code: error.code,
        missing: error?.details?.missing || null
      });
      return toAuthErrorResponse(NextResponse.json, error);
    }

    if (isAuthError(error)) {
      return toAuthErrorResponse(NextResponse.json, error);
    }

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
