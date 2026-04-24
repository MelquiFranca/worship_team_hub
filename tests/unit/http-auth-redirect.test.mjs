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

function mockFetchWithResponse(response) {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => response;

  return {
    restore() {
      globalThis.fetch = previousFetch;
    }
  };
}

test('redireciona para /login quando receber 401 AUTH_TOKEN_MISSING em rota app', async () => {
  const browser = mockBrowserLocation('/escalas');
  const fetchMock = mockFetchWithResponse(createJsonResponse({ code: 'AUTH_TOKEN_MISSING' }, 401));

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
  const fetchMock = mockFetchWithResponse(createJsonResponse({ code: 'AUTH_TOKEN_MISSING' }, 401));

  try {
    await assert.rejects(() => requestJson('/api/auth/profile'), /Nao foi possivel autenticar a requisicao/);
    assert.deepEqual(browser.redirects, ['/admin/login']);
  } finally {
    fetchMock.restore();
    browser.restore();
  }
});

test('evita loop quando ja esta em rota de login', async () => {
  const firstFetchMock = mockFetchWithResponse(createJsonResponse({ code: 'AUTH_TOKEN_MISSING' }, 401));
  const appLoginBrowser = mockBrowserLocation('/login');

  try {
    await assert.rejects(() => requestJson('/api/auth/profile'), /Nao foi possivel autenticar a requisicao/);
    assert.equal(appLoginBrowser.redirects.length, 0);
  } finally {
    firstFetchMock.restore();
    appLoginBrowser.restore();
  }

  const secondFetchMock = mockFetchWithResponse(createJsonResponse({ code: 'AUTH_TOKEN_MISSING' }, 401));
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
  const fetchMock = mockFetchWithResponse(createJsonResponse({ code: 'AUTH_INVALID_SIGNATURE' }, 401));

  try {
    await assert.rejects(() => requestJson('/api/auth/profile'), /Nao foi possivel autenticar a requisicao/);
    assert.equal(browser.redirects.length, 0);
  } finally {
    fetchMock.restore();
    browser.restore();
  }
});
