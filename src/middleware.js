import { NextResponse } from 'next/server';
import { getLoginPathForPolicy, getRoutePolicy, isPublicAuthPath } from './lib/auth/policies';

const DEFAULT_COOKIE_NAMES = [
  'access_token',
  'accessToken',
  'auth_token',
  'authToken',
  'jwt',
  'token',
  'session',
  'escalas-app:access-token',
  'escalas-app:auth-token',
  'escalas-app:jwt'
];

function normalizePathname(pathname) {
  if (!pathname) {
    return '/';
  }

  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function isStaticAssetPath(pathname) {
  return (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    /\.[^/]+$/.test(pathname)
  );
}

function splitConfiguredCookieNames() {
  const configuredNames = [
    process.env.AUTH_COOKIE_NAME,
    process.env.AUTH_ACCESS_COOKIE_NAME,
    process.env.AUTH_JWT_COOKIE_NAME
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set([...configuredNames, ...DEFAULT_COOKIE_NAMES])];
}

function normalizeTokenValue(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/^Bearer\s+/i, '').replace(/^"(.*)"$/, '$1');
}

function looksLikeJwt(value) {
  return typeof value === 'string' && value.split('.').length === 3;
}

function base64UrlToBytes(segment) {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');

  if (typeof atob === 'function') {
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  return Uint8Array.from(Buffer.from(padded, 'base64'));
}

function decodeJwtJson(segment) {
  try {
    const bytes = base64UrlToBytes(segment);
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => toStringArray(item));
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return [String(value)];
  }

  return [];
}

function toNumber(value) {
  const numericValue = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(numericValue) ? numericValue : null;
}

function getCookieCandidates(request) {
  const preferredNames = splitConfiguredCookieNames();
  const cookies = request.cookies.getAll();
  const candidateValues = [];
  const seen = new Set();

  for (const cookieName of preferredNames) {
    const cookieValue = normalizeTokenValue(request.cookies.get(cookieName)?.value);
    if (!cookieValue || seen.has(cookieValue) || !looksLikeJwt(cookieValue)) {
      continue;
    }

    candidateValues.push(cookieValue);
    seen.add(cookieValue);
  }

  for (const cookie of cookies) {
    const cookieName = cookie.name ?? '';
    if (/refresh/i.test(cookieName) || !/(auth|token|jwt|session)/i.test(cookieName)) {
      continue;
    }

    const cookieValue = normalizeTokenValue(cookie.value);
    if (!cookieValue || seen.has(cookieValue) || !looksLikeJwt(cookieValue)) {
      continue;
    }

    candidateValues.push(cookieValue);
    seen.add(cookieValue);
  }

  return candidateValues;
}

function getExpectedIssuer() {
  return process.env.AUTH_JWT_ISSUER ?? process.env.JWT_ISSUER ?? '';
}

function getSecretCandidates() {
  return [
    process.env.AUTH_JWT_SECRET,
    process.env.JWT_SECRET,
    process.env.AUTH_SECRET,
    process.env.SESSION_SECRET,
    process.env.NEXTAUTH_SECRET,
    'escalas-app-development-jwt-secret'
  ].filter(Boolean);
}

function getPublicKeyCandidates() {
  return [
    process.env.AUTH_JWT_PUBLIC_KEY,
    process.env.JWT_PUBLIC_KEY,
    process.env.AUTH_PUBLIC_KEY
  ].filter(Boolean);
}

function pemToArrayBuffer(pem) {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  return base64UrlToBytes(body).buffer;
}

async function verifyJwtSignature(token, header) {
  const algorithm = typeof header?.alg === 'string' ? header.alg : '';
  if (!algorithm || algorithm === 'none') {
    return false;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
  const signingInput = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const signature = base64UrlToBytes(encodedSignature);

  if (algorithm === 'HS256') {
    const [secret] = getSecretCandidates();
    if (!secret) {
      return true;
    }

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    return crypto.subtle.verify('HMAC', key, signature, signingInput);
  }

  if (algorithm === 'RS256') {
    const [publicKey] = getPublicKeyCandidates();
    if (!publicKey) {
      return true;
    }

    const key = await crypto.subtle.importKey(
      'spki',
      pemToArrayBuffer(publicKey),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signingInput);
  }

  return false;
}

function tokenHasRequiredClaims(payload) {
  const subject = typeof payload?.sub === 'string' ? payload.sub.trim() : '';
  const audiences = toStringArray(payload?.aud ?? payload?.audience);
  const roles = toStringArray(payload?.role ?? payload?.roles);
  const exp = toNumber(payload?.exp);

  if (!subject || !audiences.length || !roles.length || exp === null) {
    return false;
  }

  const expectedIssuer = getExpectedIssuer();
  if (expectedIssuer && payload?.iss !== expectedIssuer) {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (exp <= nowInSeconds) {
    return false;
  }

  const notBefore = toNumber(payload?.nbf);
  if (notBefore !== null && notBefore > nowInSeconds) {
    return false;
  }

  return true;
}

function isTokenAllowedForPolicy(payload, policy) {
  const audiences = toStringArray(payload?.aud ?? payload?.audience);
  const roles = toStringArray(payload?.role ?? payload?.roles);

  if (!audiences.length || !roles.length) {
    return false;
  }

  return policy.allowedPairs.some(
    (pair) => audiences.includes(pair.aud) && roles.includes(pair.role)
  );
}

async function inspectToken(token, policy) {
  const normalizedToken = normalizeTokenValue(token);
  if (!looksLikeJwt(normalizedToken)) {
    return { status: 'invalid' };
  }

  const [encodedHeader, encodedPayload] = normalizedToken.split('.');
  const header = decodeJwtJson(encodedHeader);
  const payload = decodeJwtJson(encodedPayload);

  if (!header || !payload || !tokenHasRequiredClaims(payload)) {
    return { status: 'invalid' };
  }

  const signatureIsValid = await verifyJwtSignature(normalizedToken, header);
  if (!signatureIsValid) {
    return { status: 'invalid' };
  }

  if (!isTokenAllowedForPolicy(payload, policy)) {
    return { status: 'forbidden' };
  }

  return { status: 'authorized' };
}

async function getAuthResult(request, policy) {
  const candidates = getCookieCandidates(request);
  if (!candidates.length) {
    return { status: 'missing' };
  }

  let sawValidJwt = false;

  for (const candidate of candidates) {
    const result = await inspectToken(candidate, policy);

    if (result.status === 'authorized') {
      return result;
    }

    if (result.status === 'forbidden') {
      sawValidJwt = true;
      continue;
    }
  }

  return sawValidJwt ? { status: 'forbidden' } : { status: 'invalid' };
}

function redirectToLogin(request, policy, error) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = getLoginPathForPolicy(policy);
  redirectUrl.search = '';

  if (error) {
    redirectUrl.searchParams.set('error', error);
  }

  return NextResponse.redirect(redirectUrl);
}

export async function middleware(request) {
  const pathname = normalizePathname(request.nextUrl.pathname);

  if (isStaticAssetPath(pathname) || isPublicAuthPath(pathname)) {
    return NextResponse.next();
  }

  const policy = getRoutePolicy(pathname);
  if (!policy) {
    return NextResponse.next();
  }

  const authResult = await getAuthResult(request, policy);
  if (authResult.status === 'authorized') {
    return NextResponse.next();
  }

  if (authResult.status === 'forbidden') {
    return redirectToLogin(request, policy, 'forbidden');
  }

  return redirectToLogin(request, policy);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)']
};
