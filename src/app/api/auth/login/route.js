import { NextResponse } from 'next/server';
import {
  AUTH_ERROR_CODES,
  authenticateWithPassword,
  buildAuthCookiePayload,
  createAuthSuccessPayload,
  isAuthError,
  toAuthErrorResponse
} from '../../../../lib/auth/index.js';
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
  const body = await readJsonBody(request);

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

  try {
    const authUsers = await loadAuthUsers();
    const result = authenticateWithPassword(authUsers, body);
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
          code: AUTH_ERROR_CODES.REQUEST_INVALID,
          message: 'A requisicao de autenticacao e invalida.'
        }
      },
      { status: 400 }
    );
  }
}
