import assert from 'node:assert/strict';
import test from 'node:test';

import {
  APP_DATA_CACHE_STORAGE_MODES,
  buildPersistableAppDataSnapshot,
  writeAppDataCacheWithFallback
} from '../../src/context/appDataCacheStorage.js';

function createSnapshot() {
  return {
    profile: {
      name: 'Usuario',
      photo: 'data:image/png;base64,AAA'
    },
    groupSettings: {
      name: 'Equipe',
      photo: 'data:image/png;base64,BBB'
    },
    components: [
      { id: 'component-1', name: 'Ana', photo: 'data:image/png;base64,CCC', isActive: true, categoryTagIds: [] },
      { id: 'component-2', name: 'Bia', photo: 'https://cdn.exemplo.com/bia.png', isActive: true, categoryTagIds: [] }
    ],
    scales: [
      {
        id: 'scale-1',
        date: '2026-06-10',
        shift: 'Noite',
        categoryTagId: 'louvor',
        canEdit: true,
        members: [
          { id: 'component-1', name: 'Ana', role: 'Vocal', photo: 'data:image/png;base64,DDD', isLeader: false }
        ],
        playlist: ['musica-1'],
        playlistEditorComponentIds: ['component-1'],
        imageEditorComponentIds: ['component-1'],
        messages: ['observacao'],
        imageAttachment: {
          id: 'image-1',
          src: 'data:image/png;base64,EEE',
          alt: 'Escala'
        }
      }
    ],
    scaleImages: [
      {
        id: 'image-1',
        src: 'data:image/png;base64,EEE',
        alt: 'Escala'
      },
      {
        id: 'image-2',
        src: 'https://cdn.exemplo.com/escala.png',
        alt: 'Escala remota'
      }
    ],
    componentUnavailability: [{ componentId: 'component-1' }],
    myUnavailability: { componentId: 'component-1', items: [] },
    meta: {
      version: 1,
      namespace: 'old',
      lastSyncedAt: null,
      lastSyncStatus: 'idle'
    }
  };
}

test('buildPersistableAppDataSnapshot removes inline media in compact mode', () => {
  const result = buildPersistableAppDataSnapshot(createSnapshot(), 'group-app:member:user-1:session-1', {
    version: 1,
    mode: APP_DATA_CACHE_STORAGE_MODES.compact
  });

  assert.equal(result.meta.storageMode, APP_DATA_CACHE_STORAGE_MODES.compact);
  assert.equal(result.profile.photo, '');
  assert.equal(result.groupSettings.photo, '');
  assert.equal(result.components[0].photo, '');
  assert.equal(result.components[1].photo, 'https://cdn.exemplo.com/bia.png');
  assert.equal(result.scales[0].members[0].photo, '');
  assert.equal(result.scales[0].imageAttachment, null);
  assert.equal(result.scaleImages.length, 1);
  assert.equal(result.scaleImages[0].src, 'https://cdn.exemplo.com/escala.png');
  assert.deepEqual(result.componentUnavailability, [{ componentId: 'component-1' }]);
});

test('writeAppDataCacheWithFallback retries with compact snapshot after quota failure', () => {
  const writes = [];
  const storage = {
    setItem(key, value) {
      writes.push(JSON.parse(value));
      if (writes.length === 1) {
        throw new Error('QuotaExceededError');
      }
      this.savedKey = key;
      this.savedValue = value;
    },
    removeItem() {
      this.removed = true;
    }
  };

  const persisted = writeAppDataCacheWithFallback(
    storage,
    'escalas-app:app-data-cache',
    createSnapshot(),
    'group-app:member:user-1:session-1',
    { version: 1 }
  );

  assert.equal(writes.length, 2);
  assert.equal(writes[0].meta.storageMode, APP_DATA_CACHE_STORAGE_MODES.full);
  assert.equal(writes[1].meta.storageMode, APP_DATA_CACHE_STORAGE_MODES.compact);
  assert.equal(persisted?.meta.storageMode, APP_DATA_CACHE_STORAGE_MODES.compact);
  assert.equal(storage.savedKey, 'escalas-app:app-data-cache');
  assert.equal(storage.removed, undefined);
});

test('writeAppDataCacheWithFallback falls back to minimal snapshot and clears storage when all attempts fail', () => {
  let attempts = 0;
  const storage = {
    setItem() {
      attempts += 1;
      throw new Error('QuotaExceededError');
    },
    removeItem(key) {
      this.removedKey = key;
    }
  };

  const persisted = writeAppDataCacheWithFallback(
    storage,
    'escalas-app:app-data-cache',
    createSnapshot(),
    'group-app:member:user-1:session-1',
    { version: 1 }
  );

  assert.equal(attempts, 3);
  assert.equal(persisted, null);
  assert.equal(storage.removedKey, 'escalas-app:app-data-cache');
});
