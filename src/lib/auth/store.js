import crypto from 'node:crypto';
import { getMongoCollections } from '../db/mongodb.js';
import { AUTH_ERROR_CODES, createAuthError } from './errors.js';

const REFRESH_SESSIONS_COLLECTION_NAME = 'auth_refresh_sessions';
const inMemoryRefreshSessions = new Map();

export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('base64url');
}

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function toDateFromSeconds(seconds) {
  return new Date(Number(seconds) * 1000);
}

function normalizeJti(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function useMemoryRefreshStore() {
  return process.env.AUTH_REFRESH_STORE?.trim().toLowerCase() === 'memory';
}

function normalizeRefreshSessionRecord(sessionRecord) {
  if (!sessionRecord || typeof sessionRecord !== 'object') {
    throw new TypeError('Refresh session record invalido.');
  }

  const jti = normalizeJti(sessionRecord.jti);

  if (!jti) {
    throw new TypeError('Refresh session record invalido.');
  }

  const expiresAt = Number(sessionRecord.expiresAt);

  if (!Number.isFinite(expiresAt) || expiresAt <= 0) {
    throw new TypeError('Refresh session record invalido.');
  }

  return {
    ...sessionRecord,
    jti,
    expiresAt,
    expiresAtDate: toDateFromSeconds(expiresAt),
    revokedAt: null,
    revokeReason: null,
    replacedByJti: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function isDuplicateKeyError(error) {
  return Boolean(error && typeof error === 'object' && error.code === 11000);
}

function toDependencyUnavailableError(operation, error) {
  return createAuthError(
    AUTH_ERROR_CODES.DEPENDENCY_UNAVAILABLE,
    'Servico de autenticacao indisponivel no momento.',
    503,
    {
      operation,
      provider: 'mongodb',
      cause: error?.message || null
    }
  );
}

async function getRefreshSessionsCollection() {
  const { db } = await getMongoCollections();
  return db.collection(REFRESH_SESSIONS_COLLECTION_NAME);
}

function pruneInMemoryExpiredSessions(now = nowInSeconds()) {
  for (const [jti, session] of inMemoryRefreshSessions.entries()) {
    if (!session || Number(session.expiresAt) <= now) {
      inMemoryRefreshSessions.delete(jti);
    }
  }
}

function storeRefreshSessionInMemory(sessionRecord) {
  const normalizedRecord = normalizeRefreshSessionRecord(sessionRecord);
  inMemoryRefreshSessions.set(normalizedRecord.jti, normalizedRecord);
  return normalizedRecord;
}

function revokeRefreshSessionInMemory(jti, reason = 'revoked', replacedByJti = null) {
  const normalizedJti = normalizeJti(jti);

  if (!normalizedJti) {
    return null;
  }

  const session = inMemoryRefreshSessions.get(normalizedJti);

  if (!session || session.revokedAt) {
    return null;
  }

  const next = {
    ...session,
    revokedAt: nowInSeconds(),
    revokeReason: reason,
    replacedByJti: replacedByJti || null,
    updatedAt: new Date()
  };
  inMemoryRefreshSessions.set(normalizedJti, next);
  return next;
}

function validateRefreshSessionInMemory(token, claims, now = nowInSeconds()) {
  if (!claims || typeof claims.jti !== 'string') {
    return {
      ok: false,
      code: 'AUTH_TOKEN_INVALID',
      reason: 'claims_missing'
    };
  }

  pruneInMemoryExpiredSessions(now);
  const session = inMemoryRefreshSessions.get(normalizeJti(claims.jti));

  if (!session) {
    return {
      ok: false,
      code: 'AUTH_REFRESH_REVOKED',
      reason: 'session_missing'
    };
  }

  if (session.revokedAt) {
    return {
      ok: false,
      code: 'AUTH_REFRESH_REVOKED',
      reason: session.revokeReason || 'revoked'
    };
  }

  if (session.tokenHash !== hashRefreshToken(token)) {
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

function rotateRefreshSessionInMemory(token, claims, nextSessionRecord, now = nowInSeconds()) {
  const validation = validateRefreshSessionInMemory(token, claims, now);

  if (!validation.ok) {
    return validation;
  }

  const nextSession = normalizeRefreshSessionRecord(nextSessionRecord);
  inMemoryRefreshSessions.set(nextSession.jti, nextSession);
  revokeRefreshSessionInMemory(claims.jti, 'rotated', nextSession.jti);

  return {
    ok: true,
    session: nextSession
  };
}

export async function storeRefreshSession(sessionRecord) {
  if (useMemoryRefreshStore()) {
    return storeRefreshSessionInMemory(sessionRecord);
  }

  const normalizedRecord = normalizeRefreshSessionRecord(sessionRecord);

  try {
    const refreshSessions = await getRefreshSessionsCollection();
    await refreshSessions.insertOne(normalizedRecord);
    return normalizedRecord;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw createAuthError(
        AUTH_ERROR_CODES.TOKEN_INVALID,
        undefined,
        401,
        {
          reason: 'refresh_session_duplicate_jti',
          jti: normalizedRecord.jti
        }
      );
    }

    throw toDependencyUnavailableError('refresh_session_store', error);
  }
}

export async function revokeRefreshSession(jti, reason = 'revoked', replacedByJti = null) {
  if (useMemoryRefreshStore()) {
    return revokeRefreshSessionInMemory(jti, reason, replacedByJti);
  }

  const normalizedJti = normalizeJti(jti);

  if (!normalizedJti) {
    return null;
  }

  try {
    const refreshSessions = await getRefreshSessionsCollection();
    const now = nowInSeconds();
    const result = await refreshSessions.findOneAndUpdate(
      {
        jti: normalizedJti,
        revokedAt: null
      },
      {
        $set: {
          revokedAt: now,
          revokeReason: reason,
          replacedByJti: replacedByJti || null,
          updatedAt: new Date()
        }
      },
      {
        returnDocument: 'after'
      }
    );

    return result || null;
  } catch (error) {
    throw toDependencyUnavailableError('refresh_session_revoke', error);
  }
}

export function isRefreshSessionRevoked(session) {
  return Boolean(session && session.revokedAt);
}

function buildRefreshSessionFilter(token, claims, now) {
  return {
    jti: normalizeJti(claims?.jti),
    tokenHash: hashRefreshToken(token),
    expiresAt: { $gt: now },
    revokedAt: null
  };
}

export async function validateRefreshSession(token, claims, now = nowInSeconds()) {
  if (useMemoryRefreshStore()) {
    return validateRefreshSessionInMemory(token, claims, now);
  }

  if (!claims || typeof claims.jti !== 'string') {
    return {
      ok: false,
      code: 'AUTH_TOKEN_INVALID',
      reason: 'claims_missing'
    };
  }

  try {
    const refreshSessions = await getRefreshSessionsCollection();
    const filter = buildRefreshSessionFilter(token, claims, now);
    const session = await refreshSessions.findOne(filter);

    if (session) {
      return {
        ok: true,
        session
      };
    }

    const baseSession = await refreshSessions.findOne({ jti: normalizeJti(claims.jti) });

    if (!baseSession) {
      return {
        ok: false,
        code: 'AUTH_REFRESH_REVOKED',
        reason: 'session_missing'
      };
    }

    if (baseSession.expiresAt <= now) {
      return {
        ok: false,
        code: 'AUTH_TOKEN_EXPIRED',
        reason: 'session_expired'
      };
    }

    if (baseSession.revokedAt) {
      return {
        ok: false,
        code: 'AUTH_REFRESH_REVOKED',
        reason: baseSession.revokeReason || 'revoked'
      };
    }

    return {
      ok: false,
      code: 'AUTH_TOKEN_INVALID',
      reason: 'hash_mismatch'
    };
  } catch (error) {
    throw toDependencyUnavailableError('refresh_session_validate', error);
  }
}

export async function rotateRefreshSession(token, claims, nextSessionRecord, now = nowInSeconds()) {
  if (useMemoryRefreshStore()) {
    return rotateRefreshSessionInMemory(token, claims, nextSessionRecord, now);
  }

  if (!claims || typeof claims.jti !== 'string') {
    return {
      ok: false,
      code: 'AUTH_TOKEN_INVALID',
      reason: 'claims_missing'
    };
  }

  const nextSession = normalizeRefreshSessionRecord(nextSessionRecord);

  try {
    const refreshSessions = await getRefreshSessionsCollection();
    await refreshSessions.insertOne(nextSession);

    const rotated = await refreshSessions.findOneAndUpdate(
      buildRefreshSessionFilter(token, claims, now),
      {
        $set: {
          revokedAt: now,
          revokeReason: 'rotated',
          replacedByJti: nextSession.jti,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!rotated) {
      await refreshSessions.deleteOne({ jti: nextSession.jti });
      return {
        ok: false,
        code: 'AUTH_REFRESH_REVOKED',
        reason: 'already_rotated_or_invalid'
      };
    }

    return {
      ok: true,
      session: nextSession
    };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return {
        ok: false,
        code: 'AUTH_TOKEN_INVALID',
        reason: 'next_session_duplicate_jti'
      };
    }

    throw toDependencyUnavailableError('refresh_session_rotate', error);
  }
}
