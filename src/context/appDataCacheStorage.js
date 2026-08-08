const APP_DATA_CACHE_STORAGE_MODES = Object.freeze({
  full: 'full',
  compact: 'compact',
  minimal: 'minimal'
});

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isInlineImage(value) {
  return normalizeString(value).startsWith('data:image/');
}

function stripInlineImage(value) {
  return isInlineImage(value) ? '' : normalizeString(value);
}

export function removeScaleImageDataFromSnapshot(snapshot) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};

  return {
    ...source,
    scales: (Array.isArray(source.scales) ? source.scales : []).map((scale) => ({
      ...scale,
      imageAttachment: null
    })),
    scaleImages: []
  };
}

function buildPersistableScales(scales, { compact = false, minimal = false } = {}) {
  return (Array.isArray(scales) ? scales : []).map((scale) => ({
    ...scale,
    members: Array.isArray(scale?.members)
      ? scale.members.map((member) => ({
        ...member,
        photo: compact || minimal ? stripInlineImage(member?.photo) : normalizeString(member?.photo)
      }))
      : [],
    playlist: minimal ? [] : Array.isArray(scale?.playlist) ? scale.playlist : [],
    messages: minimal ? [] : Array.isArray(scale?.messages) ? scale.messages : [],
    imageAttachment: null
  }));
}

export function buildPersistableAppDataSnapshot(snapshot, namespace, { version, mode = APP_DATA_CACHE_STORAGE_MODES.full } = {}) {
  const baseSnapshot = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const meta = baseSnapshot.meta && typeof baseSnapshot.meta === 'object' ? baseSnapshot.meta : {};
  const compact = mode === APP_DATA_CACHE_STORAGE_MODES.compact;
  const minimal = mode === APP_DATA_CACHE_STORAGE_MODES.minimal;

  return removeScaleImageDataFromSnapshot({
    ...baseSnapshot,
    profile: baseSnapshot.profile
      ? {
        ...baseSnapshot.profile,
        photo: compact || minimal ? stripInlineImage(baseSnapshot.profile.photo) : normalizeString(baseSnapshot.profile.photo)
      }
      : null,
    groupSettings: baseSnapshot.groupSettings && typeof baseSnapshot.groupSettings === 'object'
      ? {
        ...baseSnapshot.groupSettings,
        photo: compact || minimal
          ? stripInlineImage(baseSnapshot.groupSettings.photo)
          : normalizeString(baseSnapshot.groupSettings.photo)
      }
      : null,
    components: (Array.isArray(baseSnapshot.components) ? baseSnapshot.components : []).map((component) => ({
      ...component,
      photo: compact || minimal ? stripInlineImage(component?.photo) : normalizeString(component?.photo)
    })),
    scales: buildPersistableScales(baseSnapshot.scales, { compact, minimal }),
    scaleImages: [],
    componentUnavailability: minimal ? null : baseSnapshot.componentUnavailability ?? null,
    myUnavailability: minimal ? null : baseSnapshot.myUnavailability ?? null,
    meta: {
      ...meta,
      version,
      namespace,
      lastSyncedAt: new Date().toISOString(),
      lastSyncStatus: 'success',
      storageMode: mode
    }
  });
}

export function writeAppDataCacheWithFallback(storage, storageKey, snapshot, namespace, { version } = {}) {
  const attempts = [
    APP_DATA_CACHE_STORAGE_MODES.full,
    APP_DATA_CACHE_STORAGE_MODES.compact,
    APP_DATA_CACHE_STORAGE_MODES.minimal
  ];

  for (const mode of attempts) {
    const candidate = buildPersistableAppDataSnapshot(snapshot, namespace, { version, mode });

    try {
      storage.setItem(storageKey, JSON.stringify(candidate));
      return candidate;
    } catch (error) {
      if (mode === APP_DATA_CACHE_STORAGE_MODES.minimal) {
        try {
          storage.removeItem(storageKey);
        } catch {
          // Ignora falha de limpeza do storage.
        }
        return null;
      }

      if (!(error instanceof Error)) {
        continue;
      }
    }
  }

  return null;
}

export { APP_DATA_CACHE_STORAGE_MODES };
