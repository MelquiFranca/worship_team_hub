import { AUTH_AUDIENCES, AUTH_COOKIE_NAMES } from '../auth/constants.js';
import { AUTH_ERROR_CODES, createAuthError } from '../auth/errors.js';
import { verifyAccessSession } from '../auth/service.js';
import { authUsers } from '../../data/authUsers.js';

const AUTHORIZED_AUDIENCES = new Set(['admin-panel', 'group-app']);

function getAccessTokenFromRequest(request) {
  return request.cookies?.get(AUTH_COOKIE_NAMES.accessToken)?.value?.trim() || '';
}

export function requireApiAccessSession(request, users = authUsers) {
  const accessToken = getAccessTokenFromRequest(request);
  const result = verifyAccessSession(users, accessToken);

  if (!AUTHORIZED_AUDIENCES.has(result.claims.aud)) {
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

  if (claims?.aud === 'group-app') {
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
