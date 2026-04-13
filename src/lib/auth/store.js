import crypto from 'node:crypto';

const refreshSessions = new Map();

export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('base64url');
}

export function pruneExpiredRefreshSessions(now = Math.floor(Date.now() / 1000)) {
  for (const [jti, session] of refreshSessions.entries()) {
    if (!session || session.expiresAt <= now) {
      refreshSessions.delete(jti);
    }
  }
}

export function storeRefreshSession(sessionRecord) {
  if (!sessionRecord || typeof sessionRecord.jti !== 'string') {
    throw new TypeError('Refresh session record invalido.');
  }

  refreshSessions.set(sessionRecord.jti, {
    ...sessionRecord,
    revokedAt: null,
    revokeReason: null,
    replacedByJti: null
  });

  return refreshSessions.get(sessionRecord.jti);
}

export function getRefreshSession(jti, now = Math.floor(Date.now() / 1000)) {
  pruneExpiredRefreshSessions(now);

  const session = refreshSessions.get(jti);
  return session || null;
}

export function revokeRefreshSession(jti, reason = 'revoked', replacedByJti = null) {
  const session = refreshSessions.get(jti);

  if (!session) {
    return null;
  }

  session.revokedAt = Math.floor(Date.now() / 1000);
  session.revokeReason = reason;
  session.replacedByJti = replacedByJti;
  refreshSessions.set(jti, session);

  return session;
}

export function isRefreshSessionRevoked(session) {
  return Boolean(session && session.revokedAt);
}

export function validateRefreshSession(token, claims, now = Math.floor(Date.now() / 1000)) {
  pruneExpiredRefreshSessions(now);

  if (!claims || typeof claims.jti !== 'string') {
    return {
      ok: false,
      code: 'AUTH_TOKEN_INVALID',
      reason: 'claims_missing'
    };
  }

  const session = refreshSessions.get(claims.jti);

  if (!session) {
    return {
      ok: false,
      code: 'AUTH_REFRESH_REVOKED',
      reason: 'session_missing'
    };
  }

  if (session.expiresAt <= now) {
    refreshSessions.delete(claims.jti);
    return {
      ok: false,
      code: 'AUTH_TOKEN_EXPIRED',
      reason: 'session_expired'
    };
  }

  if (session.revokedAt) {
    return {
      ok: false,
      code: 'AUTH_REFRESH_REVOKED',
      reason: session.revokeReason || 'revoked'
    };
  }

  const tokenHash = hashRefreshToken(token);

  if (session.tokenHash !== tokenHash) {
    return {
      ok: false,
      code: 'AUTH_TOKEN_INVALID',
      reason: 'hash_mismatch'
    };
  }

  return {
    ok: true,
    session
  };
}

