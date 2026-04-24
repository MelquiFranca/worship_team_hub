import { ensureAppServiceWorkerRegistration } from '@/lib/pwa/registerAppServiceWorker';

const RETRYABLE_PUSH_REGISTRATION_REASONS = new Set([
  'public-key-request-failed',
  'vapid-not-configured',
  'service-worker-registration-failed',
  'subscription-read-failed',
  'subscription-create-failed',
  'subscribe-request-failed'
]);

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function normalizePermission(value) {
  if (value === 'granted' || value === 'denied' || value === 'default') {
    return value;
  }

  return 'default';
}

export function isRetryablePushRegistrationReason(reason) {
  return RETRYABLE_PUSH_REGISTRATION_REASONS.has(reason);
}

export async function registerClientPushSubscription(options = {}) {
  const { requestPermissionIfDefault = true } = options;

  if (!isPushSupported()) {
    return { ok: false, supported: false, permission: 'unsupported', reason: 'unsupported' };
  }

  let permission = normalizePermission(Notification.permission);

  if (permission === 'default' && requestPermissionIfDefault) {
    try {
      permission = normalizePermission(await Notification.requestPermission());
    } catch {
      return { ok: false, supported: true, permission: 'default', reason: 'permission-request-failed' };
    }
  }

  if (permission !== 'granted') {
    return {
      ok: false,
      supported: true,
      permission,
      reason: permission === 'denied' ? 'permission-denied' : 'permission-default'
    };
  }

  let keyResponse;

  try {
    keyResponse = await fetch('/api/push/public-key', {
      method: 'GET',
      credentials: 'include'
    });
  } catch {
    return { ok: false, supported: true, permission, reason: 'public-key-request-failed' };
  }

  if (!keyResponse.ok) {
    return { ok: false, supported: true, permission, reason: 'public-key-request-failed' };
  }

  const keyPayload = await keyResponse.json().catch(() => null);
  const publicKey = typeof keyPayload?.publicKey === 'string' ? keyPayload.publicKey.trim() : '';

  if (!publicKey) {
    return { ok: false, supported: true, permission, reason: 'vapid-not-configured' };
  }

  const registration = await ensureAppServiceWorkerRegistration();

  if (!registration) {
    return { ok: false, supported: true, permission, reason: 'service-worker-registration-failed' };
  }

  let subscription = null;

  try {
    subscription = await registration.pushManager.getSubscription();
  } catch {
    return { ok: false, supported: true, permission, reason: 'subscription-read-failed' };
  }

  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    } catch {
      return { ok: false, supported: true, permission, reason: 'subscription-create-failed' };
    }
  }

  let subscribeResponse;

  try {
    subscribeResponse = await fetch('/api/push/subscribe', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ subscription })
    });
  } catch {
    return { ok: false, supported: true, permission, reason: 'subscribe-request-failed' };
  }

  if (!subscribeResponse.ok) {
    return { ok: false, supported: true, permission, reason: 'subscribe-request-failed' };
  }

  return { ok: true, supported: true, permission: 'granted', reason: null };
}
