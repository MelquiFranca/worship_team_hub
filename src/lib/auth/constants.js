export const AUTH_ISSUER = 'escalas-app/auth';

export const AUTH_AUDIENCES = Object.freeze([
  'admin-panel',
  'group-app',
  'component-app'
]);

export const AUTH_ROLES = Object.freeze({
  ADMIN: 'admin',
  GROUP_OWNER: 'group_owner',
  COMPONENT: 'component'
});

export const ROLE_AUDIENCE_MAP = Object.freeze({
  [AUTH_ROLES.ADMIN]: 'admin-panel',
  [AUTH_ROLES.GROUP_OWNER]: 'group-app',
  [AUTH_ROLES.COMPONENT]: 'component-app'
});

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export const AUTH_COOKIE_NAMES = Object.freeze({
  accessToken: 'escalas_access_token',
  refreshToken: 'escalas_refresh_token'
});

export const AUTH_STATUS_CODES = Object.freeze({
  REQUEST_INVALID: 400,
  CREDENTIALS_INVALID: 401,
  TOKEN_MISSING: 401,
  TOKEN_INVALID: 401,
  TOKEN_EXPIRED: 401,
  REFRESH_REVOKED: 401,
  GROUP_INACTIVE: 403,
  AUDIENCE_FORBIDDEN: 403,
  ROLE_FORBIDDEN: 403
});
