import { AUTH_AUDIENCES, AUTH_COOKIE_NAMES } from '../auth/constants.js';
import { AUTH_ERROR_CODES, createAuthError } from '../auth/errors.js';
import { verifyAccessSession } from '../auth/service.js';
import { loadAuthUsers } from '../auth/userSource.js';

const AUTHORIZED_AUDIENCES = new Set(['admin-panel', 'group-app']);
const SELF_SCOPED_AUDIENCES = new Set(['group-app', 'component-app']);

function getAccessTokenFromRequest(request) {
  return request.cookies?.get(AUTH_COOKIE_NAMES.accessToken)?.value?.trim() || '';
}

export async function requireApiAccessSession(request, options = {}) {
  const {
    users,
    allowedAudiences = AUTHORIZED_AUDIENCES
  } = options;
  const resolvedUsers = Array.isArray(users) ? users : await loadAuthUsers();
  const accessToken = getAccessTokenFromRequest(request);
  const result = verifyAccessSession(resolvedUsers, accessToken);

  if (!allowedAudiences.has(result.claims.aud)) {
    throw createAuthError(
      AUTH_ERROR_CODES.AUDIENCE_FORBIDDEN,
      'A audiencia informada nao tem acesso a esta operacao.',
      403,
      { audience: result.claims.aud }
    );
  }

  return result;
}

export function resolveRequestGroupId(claims, options = {}) {
  const bodyGroupId = typeof options.bodyGroupId === 'string' ? options.bodyGroupId.trim() : '';
  const queryGroupId = typeof options.queryGroupId === 'string' ? options.queryGroupId.trim() : '';

  if (SELF_SCOPED_AUDIENCES.has(claims?.aud)) {
    const claimGroupId = typeof claims.groupId === 'string' ? claims.groupId.trim() : '';

    if (!claimGroupId) {
      throw createAuthError(
        AUTH_ERROR_CODES.TOKEN_INVALID,
        'Token de autenticacao sem grupo associado.',
        401
      );
    }

    if ((bodyGroupId && bodyGroupId !== claimGroupId) || (queryGroupId && queryGroupId !== claimGroupId)) {
      throw createAuthError(
        AUTH_ERROR_CODES.ROLE_FORBIDDEN,
        'Nao e permitido alterar o grupo desta sessao.',
        403,
        { audience: claims.aud }
      );
    }

    return claimGroupId;
  }

  const resolvedGroupId = queryGroupId || bodyGroupId;

  if (!resolvedGroupId) {
    throw createAuthError(
      AUTH_ERROR_CODES.REQUEST_INVALID,
      'Informe groupId para esta operacao.',
      400
    );
  }

  return resolvedGroupId;
}

export function isAllowedApiAudience(audience) {
  return AUTHORIZED_AUDIENCES.has(audience) && AUTH_AUDIENCES.includes(audience);
}
