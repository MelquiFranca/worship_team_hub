import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAMES,
  AUTH_ERROR_CODES,
  buildAuthCookiePayload,
  createAuthSuccessPayload,
  isAuthError,
  refreshAuthSession,
  toAuthErrorResponse
} from '../../../../lib/auth/index.js';
import { authUsers as seededAuthUsers } from '../../../../data/authUsers.js';

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
  const body = await readJsonBody(request);
  const refreshToken =
    request.cookies?.get(AUTH_COOKIE_NAMES.refreshToken)?.value ||
    body?.refreshToken ||
    body?.token ||
    '';

  try {
    const result = refreshAuthSession(seededAuthUsers, refreshToken);
    const response = NextResponse.json(createAuthSuccessPayload(result.user, result.session));

    setAuthCookies(response, buildAuthCookiePayload(result.tokens));
    return response;
  } catch (error) {
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
