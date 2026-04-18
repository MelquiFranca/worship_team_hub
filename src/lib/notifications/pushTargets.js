import { normalizeString } from '../api/validation.js';

const PUSH_TARGET_SEPARATOR_PATTERN = /[\n,;]+/;

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function uniqueTargets(values) {
  const seen = new Set();
  const items = [];

  for (const entry of values) {
    const normalizedEntry = normalizeString(entry);

    if (!normalizedEntry || seen.has(normalizedEntry)) {
      continue;
    }

    seen.add(normalizedEntry);
    items.push(normalizedEntry);
  }

  return items;
}

function splitStringTargets(value) {
  if (typeof value !== 'string') {
    return null;
  }

  return value.split(PUSH_TARGET_SEPARATOR_PATTERN);
}

function resolveLegacyPushTargetCandidates(document) {
  if (!isPlainObject(document)) {
    return [];
  }

  const pushNotification = isPlainObject(document.pushNotification) ? document.pushNotification : {};
  const webPush = isPlainObject(document.webPush) ? document.webPush : {};

  const safeTargets = (value) => normalizePushTargetsInput(value) || [];

  return [
    ...safeTargets(document.pushTargets),
    ...safeTargets(document.pushTokens),
    ...safeTargets(document.notificationTargets),
    ...safeTargets(document.deviceTokens),
    ...safeTargets(pushNotification.tokens),
    ...safeTargets(webPush.tokens),
    normalizeString(document.pushToken),
    normalizeString(pushNotification.token),
    normalizeString(webPush.token)
  ];
}

export function normalizePushTargetsInput(value) {
  if (value === undefined || value === null) {
    return [];
  }

  if (Array.isArray(value)) {
    return uniqueTargets(value);
  }

  const fromString = splitStringTargets(value);

  if (fromString) {
    return uniqueTargets(fromString);
  }

  return null;
}

export function serializeComponentPushTargets(document) {
  return uniqueTargets(resolveLegacyPushTargetCandidates(document));
}
