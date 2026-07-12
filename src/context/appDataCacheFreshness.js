export const APP_DATA_CACHE_TTL_MS = 10 * 60 * 1000;

function toTimestamp(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return NaN;
  }

  return Date.parse(value);
}

export function isAppDataSnapshotFresh(snapshot, namespace, nowMs = Date.now()) {
  if (!snapshot || typeof snapshot !== 'object') {
    return false;
  }

  const meta = snapshot.meta && typeof snapshot.meta === 'object' ? snapshot.meta : null;

  if (!meta || meta.namespace !== namespace || meta.lastSyncStatus !== 'success') {
    return false;
  }

  const lastSyncedAtMs = toTimestamp(meta.lastSyncedAt);

  if (!Number.isFinite(lastSyncedAtMs) || lastSyncedAtMs > nowMs) {
    return false;
  }

  return nowMs - lastSyncedAtMs < APP_DATA_CACHE_TTL_MS;
}
