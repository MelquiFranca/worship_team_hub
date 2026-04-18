import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAMES,
  AUTH_ERROR_CODES,
  createAuthSuccessPayload,
  isAuthError,
  toAuthErrorResponse,
  verifyAccessSession
} from '../../../../lib/auth/index.js';
import { loadAuthUsers } from '../../../../lib/auth/userSource.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBearerToken(request) {
  const authorization = request.headers.get('authorization') || '';

  if (!authorization.toLowerCase().startsWith('bearer ')) {
    return '';
  }

  return authorization.slice(7).trim();
}

export async function GET(request) {
  const accessToken =
    request.cookies?.get(AUTH_COOKIE_NAMES.accessToken)?.value ||
    getBearerToken(request);

  try {
    const authUsers = await loadAuthUsers();
    const result = verifyAccessSession(authUsers, accessToken);

    return NextResponse.json(
      createAuthSuccessPayload(result.user, {
        audience: result.claims.aud,
        accessTokenExpiresAt: new Date(result.claims.exp * 1000).toISOString(),
        issuedAt: new Date(result.claims.iat * 1000).toISOString()
      })
    );
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
