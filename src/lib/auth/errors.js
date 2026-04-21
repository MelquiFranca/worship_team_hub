import { AUTH_STATUS_CODES } from './constants.js';

export const AUTH_ERROR_CODES = Object.freeze({
  CONFIG_MISSING: 'AUTH_CONFIG_MISSING',
  REQUEST_INVALID: 'AUTH_REQUEST_INVALID',
  CREDENTIALS_MISSING: 'AUTH_CREDENTIALS_MISSING',
  CREDENTIALS_INVALID: 'AUTH_CREDENTIALS_INVALID',
  TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  GROUP_INACTIVE: 'AUTH_GROUP_INACTIVE',
  AUDIENCE_FORBIDDEN: 'AUTH_AUDIENCE_FORBIDDEN',
  ROLE_FORBIDDEN: 'AUTH_ROLE_FORBIDDEN',
  REFRESH_REVOKED: 'AUTH_REFRESH_REVOKED'
});

const DEFAULT_MESSAGES = Object.freeze({
  [AUTH_ERROR_CODES.CONFIG_MISSING]: 'Servico de autenticacao indisponivel por configuracao ausente.',
  [AUTH_ERROR_CODES.REQUEST_INVALID]: 'A requisicao de autenticacao e invalida.',
  [AUTH_ERROR_CODES.CREDENTIALS_MISSING]: 'Informe identificador e senha para continuar.',
  [AUTH_ERROR_CODES.CREDENTIALS_INVALID]: 'Credenciais invalidas.',
  [AUTH_ERROR_CODES.TOKEN_MISSING]: 'Token de autenticacao ausente.',
  [AUTH_ERROR_CODES.TOKEN_INVALID]: 'Token de autenticacao invalido.',
  [AUTH_ERROR_CODES.TOKEN_EXPIRED]: 'Token de autenticacao expirado.',
  [AUTH_ERROR_CODES.GROUP_INACTIVE]: 'Grupo inativo. Status atual do grupo: inactive.',
  [AUTH_ERROR_CODES.AUDIENCE_FORBIDDEN]: 'A audiencia informada nao e permitida para este usuario.',
  [AUTH_ERROR_CODES.ROLE_FORBIDDEN]: 'O perfil do usuario nao tem acesso para esta operacao.',
  [AUTH_ERROR_CODES.REFRESH_REVOKED]: 'O refresh token foi revogado ou ja foi usado.'
});

export function isAuthConfigMissingError(error) {
  return error?.code === AUTH_ERROR_CODES.CONFIG_MISSING;
}

export function logAuthTechnicalEvent(event, metadata = {}, logger = console) {
  const logEntry = {
    event,
    domain: 'auth',
    timestamp: new Date().toISOString(),
    ...metadata
  };

  logger.error(JSON.stringify(logEntry));
}

export class AuthError extends Error {
  constructor(code, message, status = AUTH_STATUS_CODES.TOKEN_INVALID, details = null) {
    super(message || DEFAULT_MESSAGES[code] || 'Erro de autenticacao.');
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function createAuthError(code, message, status, details = null) {
  const resolvedStatus = status ?? AUTH_STATUS_CODES.TOKEN_INVALID;
  return new AuthError(code, message, resolvedStatus, details);
}

export function isAuthError(error) {
  return error instanceof AuthError || Boolean(error && typeof error === 'object' && error.code);
}

export function toAuthErrorPayload(error) {
  const code = error?.code || AUTH_ERROR_CODES.TOKEN_INVALID;
  const message = error?.message || DEFAULT_MESSAGES[code] || 'Erro de autenticacao.';

  return {
    error: {
      code,
      message
    }
  };
}

export function toAuthErrorResponse(responseFactory, error) {
  const status = error?.status || AUTH_STATUS_CODES.TOKEN_INVALID;
  return responseFactory(toAuthErrorPayload(error), { status });
}

export function getDefaultAuthMessage(code) {
  return DEFAULT_MESSAGES[code] || 'Erro de autenticacao.';
}
