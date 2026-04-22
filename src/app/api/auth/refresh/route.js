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
      return NextResponse.json(
        buildRateLimitErrorPayload(rateLimitResult),
        buildRateLimitResponseInit(rateLimitResult)
      );
    }

    const authUsers = await loadAuthUsers();
    const result = await refreshAuthSession(authUsers, refreshToken);
    const response = NextResponse.json(createAuthSuccessPayload(result.user, result.session));

    setAuthCookies(response, buildAuthCookiePayload(result.tokens));
    return response;
  } catch (error) {
    if (isAuthConfigMissingError(error)) {
      logAuthTechnicalEvent('auth_config_invalid', {
        route: '/api/auth/refresh',
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
          code: AUTH_ERROR_CODES.TOKEN_INVALID,
          message: 'Token de autenticacao invalido.'
        }
      },
      { status: 401 }
    );
  }
}
