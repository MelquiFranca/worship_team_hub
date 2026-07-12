import assert from 'node:assert/strict';
import test from 'node:test';

import {
  APP_DATA_CACHE_TTL_MS,
  isAppDataSnapshotFresh
} from '../../src/context/appDataCacheFreshness.js';

const NAMESPACE = 'group-app:member:user-1:session-1';
const NOW_MS = Date.parse('2026-07-12T12:00:00.000Z');

function createSnapshot(metaOverrides = {}) {
  return {
    meta: {
      namespace: NAMESPACE,
      lastSyncedAt: new Date(NOW_MS - 60_000).toISOString(),
      lastSyncStatus: 'success',
      ...metaOverrides
    }
  };
}

test('isAppDataSnapshotFresh accepts successful snapshot from current namespace within ttl', () => {
  assert.equal(isAppDataSnapshotFresh(createSnapshot(), NAMESPACE, NOW_MS), true);
});

test('isAppDataSnapshotFresh rejects snapshot at ttl boundary', () => {
  const snapshot = createSnapshot({
    lastSyncedAt: new Date(NOW_MS - APP_DATA_CACHE_TTL_MS).toISOString()
  });

  assert.equal(isAppDataSnapshotFresh(snapshot, NAMESPACE, NOW_MS), false);
});

test('isAppDataSnapshotFresh rejects expired snapshot', () => {
  const snapshot = createSnapshot({
    lastSyncedAt: new Date(NOW_MS - APP_DATA_CACHE_TTL_MS - 1).toISOString()
  });

  assert.equal(isAppDataSnapshotFresh(snapshot, NAMESPACE, NOW_MS), false);
});

test('isAppDataSnapshotFresh rejects invalid or errored snapshot metadata', () => {
  assert.equal(isAppDataSnapshotFresh(null, NAMESPACE, NOW_MS), false);
  assert.equal(isAppDataSnapshotFresh(createSnapshot({ namespace: 'other' }), NAMESPACE, NOW_MS), false);
  assert.equal(isAppDataSnapshotFresh(createSnapshot({ lastSyncStatus: 'error' }), NAMESPACE, NOW_MS), false);
  assert.equal(isAppDataSnapshotFresh(createSnapshot({ lastSyncedAt: null }), NAMESPACE, NOW_MS), false);
  assert.equal(isAppDataSnapshotFresh(createSnapshot({ lastSyncedAt: 'not-a-date' }), NAMESPACE, NOW_MS), false);
  assert.equal(
    isAppDataSnapshotFresh(createSnapshot({ lastSyncedAt: new Date(NOW_MS + 1).toISOString() }), NAMESPACE, NOW_MS),
    false
  );
});
