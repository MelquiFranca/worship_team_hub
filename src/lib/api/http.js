function pickFirstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
}

function normalizePathname(pathname) {
  if (typeof pathname !== 'string' || !pathname.trim()) {
    return '/';
  }

  const normalized = pathname.trim();
  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

function getApiErrorCode(payload) {
  return pickFirstString(
    payload?.code,
    payload?.errorCode,
    payload?.error?.code,
    payload?.error?.errorCode,
    payload?.name
  ).toUpperCase();
}

function isAuthTokenMissingError(status, payload) {
  return status === 401 && getApiErrorCode(payload) === 'AUTH_TOKEN_MISSING';
}

const AUTH_SILENT_REFRESH_ERROR_CODES = new Set(['AUTH_TOKEN_MISSING', 'AUTH_TOKEN_EXPIRED']);
const AUTH_SILENT_REFRESH_BLOCKED_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/logout'
]);
let refreshInFlightPromise = null;

function isRecoverableSessionError(status, payload) {
  return status === 401 && AUTH_SILENT_REFRESH_ERROR_CODES.has(getApiErrorCode(payload));
}

function extractRequestUrl(url) {
  if (typeof url === 'string') {
    return url;
  }

  if (url && typeof url === 'object' && typeof url.url === 'string') {
    return url.url;
  }

  return '';
}

function resolveRequestPathname(url) {
  const rawUrl = extractRequestUrl(url);
  if (!rawUrl) {
    return '/';
  }

  const baseOrigin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'http://localhost';

  try {
    return normalizePathname(new URL(rawUrl, baseOrigin).pathname);
  } catch {
    return '/';
  }
}

function shouldSkipSilentRefresh(url) {
  return AUTH_SILENT_REFRESH_BLOCKED_PATHS.has(resolveRequestPathname(url));
}

function resolveLoginPathByCurrentRoute(pathname) {
  const currentPath = normalizePathname(pathname);
  const isAdminProtectedPath = currentPath === '/admin' || currentPath.startsWith('/admin/');

  return isAdminProtectedPath ? '/admin/login' : '/login';
}

function redirectToLoginWhenNeeded() {
  if (typeof window === 'undefined' || !window.location) {
    return;
  }

  const currentPath = normalizePathname(window.location.pathname);
  const targetPath = resolveLoginPathByCurrentRoute(currentPath);

  if (currentPath === targetPath) {
    return;
  }

  if (typeof window.location.replace === 'function') {
    window.location.replace(targetPath);
    return;
  }

  window.location.href = targetPath;
}

export async function readResponsePayload(response) {
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return { message: rawBody };
  }
}

export function getApiErrorMessage(payload, status, fallbackMessage = 'Nao foi possivel concluir a operacao.') {
  const rawCode = getApiErrorCode(payload);

  const rawMessage = pickFirstString(
    payload?.message,
    payload?.error?.message,
    typeof payload?.error === 'string' ? payload.error : '',
    payload?.detail,
    payload?.error?.detail
  );
  const safeRawMessage = rawMessage.startsWith('<') || rawMessage.length > 240 ? '' : rawMessage;

  const codeMessages = {
    BAD_REQUEST: 'Corrija os campos informados e tente novamente.',
    CONFLICT: 'Ja existe um registro com esses dados.',
    NOT_FOUND: 'O recurso solicitado nao foi encontrado.',
    VALIDATION_ERROR: 'Verifique os campos informados e tente novamente.'
  };

  if (rawCode && codeMessages[rawCode]) {
    return codeMessages[rawCode];
  }

  if (safeRawMessage) {
    return safeRawMessage;
  }

  if (status === 400) {
    return 'Corrija os campos informados e tente novamente.';
  }

  if (status === 401) {
    return 'Nao foi possivel autenticar a requisicao.';
  }

  if (status === 403) {
    return 'Voce nao tem permissao para concluir esta acao.';
  }

  if (status === 404) {
    return 'O servico solicitado nao foi encontrado.';
  }

  if (status === 409) {
    return 'Ja existe um registro com esses dados.';
  }

  if (status === 422) {
    return 'Verifique os campos informados e tente novamente.';
  }

  if (status >= 500) {
    return 'O servico esta indisponivel no momento. Tente novamente em instantes.';
  }

  return fallbackMessage;
}

function buildJsonRequestInit(options = {}) {
  const { body, headers, method = 'GET', ...fetchOptions } = options;
  return {
    ...fetchOptions,
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  };
}

async function refreshAuthSessionSilently() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  const payload = await readResponsePayload(response);

  if (!response.ok) {
    const error = new Error(getApiErrorMessage(payload, response.status, 'Nao foi possivel renovar a sessao.'));
    error.status = response.status;
    error.code = getApiErrorCode(payload);
    throw error;
  }

  return payload;
}

function ensureSingleFlightRefresh() {
  if (!refreshInFlightPromise) {
    refreshInFlightPromise = refreshAuthSessionSilently().finally(() => {
      refreshInFlightPromise = null;
    });
  }

  return refreshInFlightPromise;
}

async function requestJsonInternal(url, options = {}, internalOptions = {}) {
  const { allowAuthRefresh = true } = internalOptions;

  const response = await fetch(url, buildJsonRequestInit(options));

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    let shouldRedirectToLogin = false;

    const canTrySilentRefresh =
      allowAuthRefresh &&
      typeof window !== 'undefined' &&
      isRecoverableSessionError(response.status, payload) &&
      !shouldSkipSilentRefresh(url);

    if (canTrySilentRefresh) {
      try {
        await ensureSingleFlightRefresh();
        return await requestJsonInternal(url, options, { allowAuthRefresh: false });
      } catch {
        shouldRedirectToLogin = true;
      }
    }

    if (shouldRedirectToLogin || isAuthTokenMissingError(response.status, payload)) {
      redirectToLoginWhenNeeded();
    }

    throw new Error(getApiErrorMessage(payload, response.status));
  }

  return payload;
}

export async function requestJson(url, options = {}) {
  return requestJsonInternal(url, options, { allowAuthRefresh: true });
}
