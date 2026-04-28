import assert from 'node:assert/strict';
import test from 'node:test';
import { requestJson } from '../../src/lib/api/http.js';

function createJsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function mockBrowserLocation(pathname) {
  const redirects = [];

  const location = {
    pathname,
    href: pathname,
    replace(targetPath) {
      redirects.push(targetPath);
      this.href = targetPath;
    }
  };

  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: { location }
  });

  return {
    redirects,
    restore() {
      if (typeof previousWindow === 'undefined') {
        delete globalThis.window;
        return;
      }

      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        writable: true,
        value: previousWindow
      });
    }
  };
}

function mockFetchWithHandler(handler) {
  const previousFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const call = { url, init, index: calls.length };
    calls.push(call);
    return handler(call, calls);
  };

  return {
    calls,
    restore() {
      globalThis.fetch = previousFetch;
    }
  };
}

test('redireciona para /login quando receber 401 AUTH_TOKEN_MISSING em rota app', async () => {
  const browser = mockBrowserLocation('/escalas');
  const fetchMock = mockFetchWithHandler(({ url }) => {
    if (url === '/api/auth/refresh') {
      return createJsonResponse({ code: 'AUTH_REFRESH_REVOKED' }, 401);
    }

    return createJsonResponse({ code: 'AUTH_TOKEN_MISSING' }, 401);
  });

  try {
    await assert.rejects(() => requestJson('/api/auth/profile'), /Nao foi possivel autenticar a requisicao/);
    assert.deepEqual(browser.redirects, ['/login']);
  } finally {
    fetchMock.restore();
    browser.restore();
  }
});

test('redireciona para /admin/login quando receber 401 AUTH_TOKEN_MISSING em rota admin protegida', async () => {
  const browser = mockBrowserLocation('/admin/grupos');
  const fetchMock = mockFetchWithHandler(({ url }) => {
    if (url === '/api/auth/refresh') {
      return createJsonResponse({ code: 'AUTH_REFRESH_REVOKED' }, 401);
    }

    return createJsonResponse({ code: 'AUTH_TOKEN_MISSING' }, 401);
  });

  try {
    await assert.rejects(() => requestJson('/api/auth/profile'), /Nao foi possivel autenticar a requisicao/);
    assert.deepEqual(browser.redirects, ['/admin/login']);
  } finally {
    fetchMock.restore();
    browser.restore();
  }
});

test('evita loop quando ja esta em rota de login', async () => {
  const firstFetchMock = mockFetchWithHandler(({ url }) => {
    if (url === '/api/auth/refresh') {
      return createJsonResponse({ code: 'AUTH_REFRESH_REVOKED' }, 401);
    }

    return createJsonResponse({ code: 'AUTH_TOKEN_MISSING' }, 401);
  });
  const appLoginBrowser = mockBrowserLocation('/login');

  try {
    await assert.rejects(() => requestJson('/api/auth/profile'), /Nao foi possivel autenticar a requisicao/);
    assert.equal(appLoginBrowser.redirects.length, 0);
  } finally {
    firstFetchMock.restore();
    appLoginBrowser.restore();
  }

  const secondFetchMock = mockFetchWithHandler(({ url }) => {
    if (url === '/api/auth/refresh') {
      return createJsonResponse({ code: 'AUTH_REFRESH_REVOKED' }, 401);
    }

    return createJsonResponse({ code: 'AUTH_TOKEN_MISSING' }, 401);
  });
  const adminLoginBrowser = mockBrowserLocation('/admin/login');

  try {
    await assert.rejects(() => requestJson('/api/auth/profile'), /Nao foi possivel autenticar a requisicao/);
    assert.equal(adminLoginBrowser.redirects.length, 0);
  } finally {
    secondFetchMock.restore();
    adminLoginBrowser.restore();
  }
});

test('mantem comportamento atual para outros erros 401 sem redirecionamento', async () => {
  const browser = mockBrowserLocation('/escalas');
  const fetchMock = mockFetchWithHandler(() => createJsonResponse({ code: 'AUTH_INVALID_SIGNATURE' }, 401));

  try {
    await assert.rejects(() => requestJson('/api/auth/profile'), /Nao foi possivel autenticar a requisicao/);
    assert.equal(browser.redirects.length, 0);
    assert.equal(fetchMock.calls.some((call) => call.url === '/api/auth/refresh'), false);
  } finally {
    fetchMock.restore();
    browser.restore();
  }
});

test('faz refresh silencioso e repete requisicao quando receber AUTH_TOKEN_MISSING', async () => {
  const browser = mockBrowserLocation('/escalas');
  let profileCalls = 0;
  let refreshCalls = 0;
  const fetchMock = mockFetchWithHandler(({ url }) => {
    if (url === '/api/auth/profile') {
      profileCalls += 1;
      if (profileCalls === 1) {
        return createJsonResponse({ code: 'AUTH_TOKEN_MISSING' }, 401);
      }

      return createJsonResponse({ item: { id: 'profile-1' } }, 200);
    }

    if (url === '/api/auth/refresh') {
      refreshCalls += 1;
      return createJsonResponse({ ok: true }, 200);
    }

    return createJsonResponse({ code: 'NOT_FOUND' }, 404);
  });

  try {
    const payload = await requestJson('/api/auth/profile');
    assert.deepEqual(payload, { item: { id: 'profile-1' } });
    assert.equal(profileCalls, 2);
    assert.equal(refreshCalls, 1);
    assert.equal(browser.redirects.length, 0);
  } finally {
    fetchMock.restore();
    browser.restore();
  }
});

test('faz refresh silencioso e repete requisicao quando receber AUTH_TOKEN_EXPIRED', async () => {
  const browser = mockBrowserLocation('/escalas');
  let scopesCalls = 0;
  let refreshCalls = 0;
  const fetchMock = mockFetchWithHandler(({ url }) => {
    if (url === '/api/scales') {
      scopesCalls += 1;
      if (scopesCalls === 1) {
        return createJsonResponse({ code: 'AUTH_TOKEN_EXPIRED' }, 401);
      }

      return createJsonResponse({ items: [] }, 200);
    }

    if (url === '/api/auth/refresh') {
      refreshCalls += 1;
      return createJsonResponse({ ok: true }, 200);
    }

    return createJsonResponse({ code: 'NOT_FOUND' }, 404);
  });

  try {
    const payload = await requestJson('/api/scales');
    assert.deepEqual(payload, { items: [] });
    assert.equal(scopesCalls, 2);
    assert.equal(refreshCalls, 1);
    assert.equal(browser.redirects.length, 0);
  } finally {
    fetchMock.restore();
    browser.restore();
  }
});

test('redireciona e lanca erro quando refresh silencioso falha', async () => {
  const browser = mockBrowserLocation('/escalas');
  const fetchMock = mockFetchWithHandler(({ url }) => {
    if (url === '/api/auth/refresh') {
      return createJsonResponse({ code: 'AUTH_REFRESH_REVOKED' }, 401);
    }

    return createJsonResponse({ code: 'AUTH_TOKEN_EXPIRED' }, 401);
  });

  try {
    await assert.rejects(() => requestJson('/api/components'), /Nao foi possivel autenticar a requisicao/);
    assert.deepEqual(browser.redirects, ['/login']);
    assert.equal(fetchMock.calls.filter((call) => call.url === '/api/auth/refresh').length, 1);
  } finally {
    fetchMock.restore();
    browser.restore();
  }
});

test('compartilha um unico refresh silencioso em requisicoes concorrentes', async () => {
  const browser = mockBrowserLocation('/escalas');
  let componentsCalls = 0;
  let scalesCalls = 0;
  let refreshCalls = 0;
  const fetchMock = mockFetchWithHandler(({ url }) => {
    if (url === '/api/components') {
      componentsCalls += 1;
      if (componentsCalls === 1) {
        return createJsonResponse({ code: 'AUTH_TOKEN_EXPIRED' }, 401);
      }

      return createJsonResponse({ items: ['component-a'] }, 200);
    }

    if (url === '/api/scales') {
      scalesCalls += 1;
      if (scalesCalls === 1) {
        return createJsonResponse({ code: 'AUTH_TOKEN_MISSING' }, 401);
      }

      return createJsonResponse({ items: ['scale-a'] }, 200);
    }

    if (url === '/api/auth/refresh') {
      refreshCalls += 1;
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(createJsonResponse({ ok: true }, 200));
        }, 10);
      });
    }

    return createJsonResponse({ code: 'NOT_FOUND' }, 404);
  });

  try {
    const [componentsPayload, scalesPayload] = await Promise.all([
      requestJson('/api/components'),
      requestJson('/api/scales')
    ]);

    assert.deepEqual(componentsPayload, { items: ['component-a'] });
    assert.deepEqual(scalesPayload, { items: ['scale-a'] });
    assert.equal(refreshCalls, 1);
    assert.equal(browser.redirects.length, 0);
  } finally {
    fetchMock.restore();
    browser.restore();
  }
});

test('nao tenta refresh silencioso para endpoints de auth bloqueados', async () => {
  const browser = mockBrowserLocation('/escalas');
  const fetchMock = mockFetchWithHandler(({ url }) => {
    if (url === '/api/auth/logout') {
      return createJsonResponse({ code: 'AUTH_TOKEN_MISSING' }, 401);
    }

    if (url === '/api/auth/refresh') {
      return createJsonResponse({ ok: true }, 200);
    }

    return createJsonResponse({ code: 'NOT_FOUND' }, 404);
  });

  try {
    await assert.rejects(() => requestJson('/api/auth/logout', { method: 'POST' }), /Nao foi possivel autenticar a requisicao/);
    assert.equal(fetchMock.calls.filter((call) => call.url === '/api/auth/refresh').length, 0);
  } finally {
    fetchMock.restore();
    browser.restore();
  }
});
