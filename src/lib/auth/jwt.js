import crypto from 'node:crypto';
import { AUTH_AUDIENCES, AUTH_ISSUER } from './constants.js';
import { AUTH_ERROR_CODES, createAuthError } from './errors.js';
import { base64UrlDecode, base64UrlEncode } from './encoding.js';

function parseJwtPart(part) {
  try {
    return JSON.parse(base64UrlDecode(part).toString('utf8'));
  } catch {
    return null;
  }
}

function createSignature(tokenBody, secret) {
  return crypto.createHmac('sha256', secret).update(tokenBody).digest();
}

function assertJwtSecret(secret, operation) {
  if (typeof secret === 'string' && secret.trim() !== '') {
    return secret.trim();
  }

  throw createAuthError(
    AUTH_ERROR_CODES.CONFIG_MISSING,
    `Configuracao JWT ausente para ${operation}.`,
    503,
    {
      operation,
      missing: ['AUTH_JWT_SECRET', 'JWT_SECRET']
    }
  );
}

function validateClaims(payload) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const requiredStringFields = ['sub', 'aud', 'role', 'iss', 'jti', 'type'];
  for (const field of requiredStringFields) {
    if (typeof payload[field] !== 'string' || payload[field].trim() === '') {
      return false;
    }
  }

  if (payload.groupId !== null && typeof payload.groupId !== 'string') {
    return false;
  }

  if (!Number.isFinite(payload.iat) || !Number.isFinite(payload.exp)) {
    return false;
  }

  return true;
}

export function signJwt(claims, secret) {
  const jwtSecret = assertJwtSecret(secret, 'sign');
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const tokenBody = `${encodedHeader}.${encodedPayload}`;
  const signature = createSignature(tokenBody, jwtSecret);

  return `${tokenBody}.${base64UrlEncode(signature)}`;
}

export function verifyJwt(token, secret, options = {}) {
  const jwtSecret = assertJwtSecret(secret, 'verify');

  if (typeof token !== 'string' || token.trim() === '') {
    throw createAuthError(
      AUTH_ERROR_CODES.TOKEN_MISSING,
      undefined,
      undefined,
      { reason: 'empty_token' }
    );
  }

  const parts = token.split('.');

  if (parts.length !== 3) {
    throw createAuthError(
      AUTH_ERROR_CODES.TOKEN_MALFORMED,
      undefined,
      undefined,
      { reason: 'segment_count' }
    );
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = parseJwtPart(encodedHeader);
  const payload = parseJwtPart(encodedPayload);

  if (!header || !payload) {
    throw createAuthError(
      AUTH_ERROR_CODES.TOKEN_MALFORMED,
      undefined,
      undefined,
      { reason: 'header_or_payload' }
    );
  }

  if (header.alg !== 'HS256' || header.typ !== 'JWT') {
    throw createAuthError(
      AUTH_ERROR_CODES.TOKEN_INVALID,
      undefined,
      undefined,
      { reason: 'header_invalid' }
    );
  }

  const tokenBody = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createSignature(tokenBody, jwtSecret);
  const actualSignature = base64UrlDecode(encodedSignature);

  if (
    actualSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(actualSignature, expectedSignature)
  ) {
    throw createAuthError(
      AUTH_ERROR_CODES.TOKEN_INVALID,
      undefined,
      undefined,
      { reason: 'signature_mismatch' }
    );
  }

  if (!validateClaims(payload)) {
    throw createAuthError(
      AUTH_ERROR_CODES.TOKEN_INVALID,
      undefined,
      undefined,
      { reason: 'claims_invalid' }
    );
  }

  const now = Number.isFinite(options.now)
    ? options.now
    : Math.floor(Date.now() / 1000);

  if (payload.iss !== (options.expectedIssuer || AUTH_ISSUER)) {
    throw createAuthError(
      AUTH_ERROR_CODES.TOKEN_INVALID,
      undefined,
      undefined,
      { reason: 'issuer_invalid' }
    );
  }

  if (options.expectedType && payload.type !== options.expectedType) {
    throw createAuthError(
      AUTH_ERROR_CODES.TOKEN_INVALID,
      undefined,
      undefined,
      { reason: 'type_invalid' }
    );
  }

  if (Array.isArray(options.allowedAudiences) && !options.allowedAudiences.includes(payload.aud)) {
    throw createAuthError(
      AUTH_ERROR_CODES.AUDIENCE_FORBIDDEN,
      undefined,
      403,
      { reason: 'audience_not_allowed', allowedAudiences: options.allowedAudiences }
    );
  }

  if (options.expectedAudience && payload.aud !== options.expectedAudience) {
    throw createAuthError(
      AUTH_ERROR_CODES.AUDIENCE_FORBIDDEN,
      undefined,
      403,
      { reason: 'audience_mismatch', expectedAudience: options.expectedAudience }
    );
  }

  if (payload.exp <= now) {
    throw createAuthError(
      AUTH_ERROR_CODES.TOKEN_EXPIRED,
      undefined,
      undefined,
      { reason: 'expired', exp: payload.exp, now }
    );
  }

  return payload;
}

export function decodeJwt(token) {
  if (typeof token !== 'string') {
    return null;
  }

  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  return {
    header: parseJwtPart(encodedHeader),
    payload: parseJwtPart(encodedPayload),
    signature: encodedSignature
  };
}
