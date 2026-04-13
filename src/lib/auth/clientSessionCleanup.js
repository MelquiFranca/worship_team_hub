const CLIENT_AUTH_STORAGE_KEYS = Object.freeze({
  adminProfile: 'escalas-app:admin-profile',
  groupSettings: 'escalas-app:group-settings'
});

const STORAGE_KEYS_TO_CLEAR = Object.freeze(Object.values(CLIENT_AUTH_STORAGE_KEYS));

function removeKeyFromStorage(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // Ignora falhas de acesso ao storage no cliente.
  }
}

export function clearClientSessionData() {
  if (typeof window === 'undefined') {
    return;
  }

  for (const key of STORAGE_KEYS_TO_CLEAR) {
    removeKeyFromStorage(window.localStorage, key);
    removeKeyFromStorage(window.sessionStorage, key);
  }
}

export { CLIENT_AUTH_STORAGE_KEYS };
