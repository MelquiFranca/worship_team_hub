import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAMES,
  buildClearedAuthCookiePayload,
  createLogoutPayload,
  logoutAuthSession
} from '../../../../lib/auth/index.js';

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

  logoutAuthSession(refreshToken);

  const response = NextResponse.json(createLogoutPayload());
  setAuthCookies(response, buildClearedAuthCookiePayload());
  return response;
}
