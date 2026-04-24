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

export async function requestJson(url, options = {}) {
  const { body, headers, method = 'GET', ...fetchOptions } = options;
  const response = await fetch(url, {
    ...fetchOptions,
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    if (isAuthTokenMissingError(response.status, payload)) {
      redirectToLoginWhenNeeded();
    }

    throw new Error(getApiErrorMessage(payload, response.status));
  }

  return payload;
}
