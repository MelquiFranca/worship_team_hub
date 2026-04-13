import { AUTH_AUDIENCES, AUTH_ROLES, ROLE_AUDIENCE_MAP } from './constants.js';

export function normalizeIdentifier(identifier) {
  if (typeof identifier !== 'string') {
    return '';
  }

  return identifier.trim().toLowerCase();
}

export function sanitizeAuthUser(user) {
  if (!user) {
    return null;
  }

  const {
    passwordHash,
    ...safeUser
  } = user;

  return safeUser;
}

export function getAudienceForRole(role) {
  return ROLE_AUDIENCE_MAP[role] || null;
}

export function isAudienceValid(audience) {
  return AUTH_AUDIENCES.includes(audience);
}

export function isAudienceAllowedForUser(user, audience) {
  const normalizedAudience = typeof audience === 'string' ? audience.trim() : '';

  if (!user || !normalizedAudience) {
    return false;
  }

  const roleAudience = getAudienceForRole(user.role);
  return roleAudience === normalizedAudience;
}

export function resolveAudienceForUser(user, requestedAudience) {
  const normalizedRequestedAudience = typeof requestedAudience === 'string'
    ? requestedAudience.trim()
    : '';

  const defaultAudience = getAudienceForRole(user?.role);

  if (!normalizedRequestedAudience) {
    return defaultAudience;
  }

  if (!isAudienceValid(normalizedRequestedAudience)) {
    return {
      ok: false,
      code: 'AUTH_AUDIENCE_FORBIDDEN'
    };
  }

  if (defaultAudience !== normalizedRequestedAudience) {
    return {
      ok: false,
      code: 'AUTH_ROLE_FORBIDDEN'
    };
  }

  return {
    ok: true,
    audience: normalizedRequestedAudience
  };
}

export function findAuthUserByIdentifier(users, identifier) {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return null;
  }

  return (
    users.find((user) => normalizeIdentifier(user.email) === normalizedIdentifier) ||
    users.find((user) => normalizeIdentifier(user.username) === normalizedIdentifier) ||
    users.find((user) => normalizeIdentifier(user.identifier) === normalizedIdentifier) ||
    null
  );
}

export function findAuthUserById(users, id) {
  if (typeof id !== 'string' || !id.trim()) {
    return null;
  }

  return users.find((user) => user.id === id) || null;
}

export function isSupportedAuthRole(role) {
  return Object.values(AUTH_ROLES).includes(role);
}

