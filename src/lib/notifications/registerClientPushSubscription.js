import { ensureAppServiceWorkerRegistration } from '@/lib/pwa/registerAppServiceWorker';

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

export async function registerClientPushSubscription() {
  if (!isPushSupported()) {
    return { ok: false, reason: 'unsupported' };
  }

  const keyResponse = await fetch('/api/push/public-key', {
    method: 'GET',
    credentials: 'include'
  });

  if (!keyResponse.ok) {
    return { ok: false, reason: 'public-key-request-failed' };
  }

  const keyPayload = await keyResponse.json().catch(() => null);
  const publicKey = typeof keyPayload?.publicKey === 'string' ? keyPayload.publicKey.trim() : '';

  if (!publicKey) {
    return { ok: false, reason: 'vapid-not-configured' };
  }

  const registration = await ensureAppServiceWorkerRegistration();

  if (!registration) {
    return { ok: false, reason: 'service-worker-registration-failed' };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return { ok: false, reason: 'permission-denied' };
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });
  }

  const subscribeResponse = await fetch('/api/push/subscribe', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ subscription })
  });

  if (!subscribeResponse.ok) {
    return { ok: false, reason: 'subscribe-request-failed' };
  }

  return { ok: true };
}
