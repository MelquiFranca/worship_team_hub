import { normalizeString } from '../api/validation.js';

const MAX_PUSH_SUBSCRIPTIONS_PER_COMPONENT = 8;

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSubscriptionKeys(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const auth = normalizeString(value.auth);
  const p256dh = normalizeString(value.p256dh);

  if (!auth || !p256dh) {
    return null;
  }

  return { auth, p256dh };
}

export function normalizePushSubscription(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const endpoint = normalizeString(value.endpoint);
  const keys = normalizeSubscriptionKeys(value.keys);
  const expirationTime = Number.isFinite(value.expirationTime) ? value.expirationTime : null;

  if (!endpoint || !keys) {
    return null;
  }

  return {
    endpoint,
    expirationTime,
    keys
  };
}

export function normalizePushSubscriptionsInput(value) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const seenEndpoints = new Set();
  const subscriptions = [];

  for (const entry of value) {
    const normalized = normalizePushSubscription(entry);

    if (!normalized || seenEndpoints.has(normalized.endpoint)) {
      continue;
    }

    seenEndpoints.add(normalized.endpoint);
    subscriptions.push(normalized);

    if (subscriptions.length >= MAX_PUSH_SUBSCRIPTIONS_PER_COMPONENT) {
      break;
    }
  }

  return subscriptions;
}

export function serializePushSubscriptions(value) {
  const normalized = normalizePushSubscriptionsInput(value);
  return Array.isArray(normalized) ? normalized : [];
}
