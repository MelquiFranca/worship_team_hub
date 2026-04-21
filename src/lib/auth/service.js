import crypto from 'node:crypto';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_AUDIENCES,
  AUTH_COOKIE_NAMES,
  AUTH_ISSUER,
  REFRESH_TOKEN_TTL_SECONDS
} from './constants.js';
import { AUTH_ERROR_CODES, createAuthError } from './errors.js';
import { signJwt, verifyJwt } from './jwt.js';
import {
  hashRefreshToken,
  revokeRefreshSession,
  storeRefreshSession,
  validateRefreshSession
} from './store.js';
import {
  findAuthUserById,
  findAuthUserByIdentifier,
  getAudienceForRole,
  isAudienceAllowedForUser,
  resolveAudienceForUser,
  sanitizeAuthUser
} from './users.js';
import { verifyPassword } from './password.js';

const JWT_SECRET = process.env.JWT_SECRET || 'escalas-app-development-jwt-secret';

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function toIsoFromSeconds(seconds) {
  return new Date(seconds * 1000).toISOString();
}

function createSessionMetadata(audience, accessClaims, refreshClaims) {
  return {
    audience,
    accessTokenExpiresAt: toIsoFromSeconds(accessClaims.exp),
    refreshTokenExpiresAt: toIsoFromSeconds(refreshClaims.exp)
  };
}

function buildClaims(user, audience, type, issuedAt, expiresAt) {
  return {
    sub: user.id,
    aud: audience,
    role: user.role,
    groupId: user.groupId ?? null,
    iat: issuedAt,
    exp: expiresAt,
    iss: AUTH_ISSUER,
    jti: crypto.randomUUID(),
    type
  };
}

function ensureAudienceForLogin(user, requestedAudience) {
  const resolution = resolveAudienceForUser(user, requestedAudience);

  if (typeof resolution === 'string') {
    return resolution;
  }

  if (!resolution?.ok) {
    throw createAuthError(
      resolution?.code || AUTH_ERROR_CODES.AUDIENCE_FORBIDDEN,
      undefined,
      resolution?.code === AUTH_ERROR_CODES.AUDIENCE_FORBIDDEN ? 403 : 403,
      {
        userId: user?.id || null,
        role: user?.role || null,
        requestedAudience
      }
    );
  }

  return resolution.audience;
}

function normalizeGroupStatus(value) {
  return typeof value === 'string' && value.trim().toLowerCase() === 'inactive' ? 'inactive' : 'active';
}

function ensureUserGroupIsActive(user) {
  const hasGroup = typeof user?.groupId === 'string' && user.groupId.trim();

  if (!hasGroup) {
    return;
  }

  const groupStatus = normalizeGroupStatus(user?.groupStatus);

  if (groupStatus !== 'inactive') {
    return;
  }

  throw createAuthError(
    AUTH_ERROR_CODES.GROUP_INACTIVE,
    `Grupo inativo. Status atual do grupo: ${groupStatus}.`,
    403,
    {
      userId: user?.id || null,
      groupId: user?.groupId || null,
      groupStatus
    }
  );
}

function issueTokenPairForUser(user, audience, issuedAt = nowInSeconds()) {
  const accessClaims = buildClaims(
    user,
    audience,
    'access',
    issuedAt,
    issuedAt + ACCESS_TOKEN_TTL_SECONDS
  );
  const refreshClaims = buildClaims(
    user,
    audience,
    'refresh',
    issuedAt,
    issuedAt + REFRESH_TOKEN_TTL_SECONDS
  );

  const accessToken = signJwt(accessClaims, JWT_SECRET);
  const refreshToken = signJwt(refreshClaims, JWT_SECRET);

  storeRefreshSession({
    jti: refreshClaims.jti,
    tokenHash: hashRefreshToken(refreshToken),
    userId: user.id,
    aud: audience,
    role: user.role,
    groupId: user.groupId ?? null,
    issuedAt,
    expiresAt: refreshClaims.exp,
    familyId: refreshClaims.jti,
    revokedAt: null,
    revokeReason: null,
    replacedByJti: null
  });

  return {
    accessToken,
    refreshToken,
    accessClaims,
    refreshClaims
  };
}

export function authenticateWithPassword(users, credentials = {}) {
  const identifier = credentials.identifier || credentials.email || credentials.username || credentials.login;
  const password = typeof credentials.password === 'string' ? credentials.password : '';

  if (!identifier || !password) {
    throw createAuthError(
      AUTH_ERROR_CODES.CREDENTIALS_MISSING,
      undefined,
      400,
      { identifierPresent: Boolean(identifier), passwordPresent: Boolean(password) }
    );
  }

  const user = findAuthUserByIdentifier(users, identifier);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw createAuthError(
      AUTH_ERROR_CODES.CREDENTIALS_INVALID,
      undefined,
      401,
      { identifier: String(identifier).trim().toLowerCase() }
    );
  }

  ensureUserGroupIsActive(user);

  const audience = ensureAudienceForLogin(user, credentials.audience || credentials.aud);
  const issuedAt = nowInSeconds();
  const tokens = issueTokenPairForUser(user, audience, issuedAt);

  return {
    user: sanitizeAuthUser(user),
    session: createSessionMetadata(audience, tokens.accessClaims, tokens.refreshClaims),
    tokens
  };
}

export function refreshAuthSession(users, refreshToken) {
  if (!refreshToken) {
    throw createAuthError(AUTH_ERROR_CODES.TOKEN_MISSING, undefined, 401);
  }

  const claims = verifyJwt(refreshToken, JWT_SECRET, {
    expectedType: 'refresh',
    expectedIssuer: AUTH_ISSUER,
    allowedAudiences: AUTH_AUDIENCES
  });

  const validation = validateRefreshSession(refreshToken, claims, nowInSeconds());

  if (!validation.ok) {
    throw createAuthError(validation.code, undefined, 401, { reason: validation.reason, jti: claims.jti });
  }

  const user = findAuthUserById(users, claims.sub);

  if (!user) {
    throw createAuthError(AUTH_ERROR_CODES.TOKEN_INVALID, undefined, 401, { reason: 'user_not_found', sub: claims.sub });
  }

  ensureUserGroupIsActive(user);

  if (!isAudienceAllowedForUser(user, claims.aud)) {
    throw createAuthError(
      AUTH_ERROR_CODES.ROLE_FORBIDDEN,
      undefined,
      403,
      { userId: user.id, role: user.role, audience: claims.aud }
    );
  }

  const issuedAt = nowInSeconds();
  const tokens = issueTokenPairForUser(user, claims.aud, issuedAt);

  revokeRefreshSession(claims.jti, 'rotated', tokens.refreshClaims.jti);

  return {
    user: sanitizeAuthUser(user),
    session: createSessionMetadata(claims.aud, tokens.accessClaims, tokens.refreshClaims),
    tokens
  };
}

export function verifyAccessSession(users, accessToken) {
  if (!accessToken) {
    throw createAuthError(AUTH_ERROR_CODES.TOKEN_MISSING, undefined, 401);
  }

  const claims = verifyJwt(accessToken, JWT_SECRET, {
    expectedType: 'access',
    expectedIssuer: AUTH_ISSUER,
    allowedAudiences: AUTH_AUDIENCES
  });
  const user = findAuthUserById(users, claims.sub);

  if (!user) {
    throw createAuthError(AUTH_ERROR_CODES.TOKEN_INVALID, undefined, 401, { reason: 'user_not_found', sub: claims.sub });
  }

  ensureUserGroupIsActive(user);

  if (!isAudienceAllowedForUser(user, claims.aud)) {
    throw createAuthError(
      AUTH_ERROR_CODES.ROLE_FORBIDDEN,
      undefined,
      403,
      { userId: user.id, role: user.role, audience: claims.aud }
    );
  }

  return {
    user: sanitizeAuthUser(user),
    claims
  };
}

export function logoutAuthSession(refreshToken) {
  if (!refreshToken) {
    return {
      ok: true,
      revoked: false
    };
  }

  try {
    const claims = verifyJwt(refreshToken, JWT_SECRET, {
      expectedType: 'refresh',
      expectedIssuer: AUTH_ISSUER,
      allowedAudiences: AUTH_AUDIENCES
    });
    const validation = validateRefreshSession(refreshToken, claims, nowInSeconds());

    if (validation.ok) {
      revokeRefreshSession(claims.jti, 'logout');
    }
  } catch {
    // Logout is intentionally idempotent.
  }

  return {
    ok: true,
    revoked: true
  };
}

export function getAuthCookieOptions(maxAgeSeconds) {
  const secure = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: maxAgeSeconds
  };
}

export function buildAuthCookiePayload(tokens) {
  return [
    {
      name: AUTH_COOKIE_NAMES.accessToken,
      value: tokens.accessToken,
      options: getAuthCookieOptions(ACCESS_TOKEN_TTL_SECONDS)
    },
    {
      name: AUTH_COOKIE_NAMES.refreshToken,
      value: tokens.refreshToken,
      options: getAuthCookieOptions(REFRESH_TOKEN_TTL_SECONDS)
    }
  ];
}

export function buildClearedAuthCookiePayload() {
  return [
    {
      name: AUTH_COOKIE_NAMES.accessToken,
      value: '',
      options: {
        ...getAuthCookieOptions(0),
        maxAge: 0
      }
    },
    {
      name: AUTH_COOKIE_NAMES.refreshToken,
      value: '',
      options: {
        ...getAuthCookieOptions(0),
        maxAge: 0
      }
    }
  ];
}

export function createAuthSuccessPayload(user, session) {
  return {
    user,
    session
  };
}

export function createLogoutPayload() {
  return {
    ok: true
  };
}

export function getDefaultAudienceForUser(user) {
  return getAudienceForRole(user?.role);
}

export function getJwtSecretForTesting() {
  return JWT_SECRET;
}
