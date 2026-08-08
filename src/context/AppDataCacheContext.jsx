'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthSession } from '@/context/AuthSessionContext';
import { CLIENT_AUTH_STORAGE_KEYS, clearClientSessionData } from '@/lib/auth/clientSessionCleanup';
import {
  APP_DATA_CACHE_STORAGE_MODES,
  removeScaleImageDataFromSnapshot,
  writeAppDataCacheWithFallback
} from '@/context/appDataCacheStorage';
import { requestJson } from '@/lib/api/http';
import { canHydrateGroupedComponentUnavailability } from '@/context/appDataHydrationPolicy';
import { isAppDataSnapshotFresh } from '@/context/appDataCacheFreshness';

const APP_DATA_CACHE_VERSION = 1;
const APP_DATA_CACHE_STORAGE_KEY = CLIENT_AUTH_STORAGE_KEYS.appDataCache;
const CURRENT_AND_FUTURE_TIME_SCOPE = 'current-and-future';
const APP_DATA_REMOTE_FETCH_OPTIONS = Object.freeze({});
const APP_DATA_REMOTE_REFRESH_FETCH_OPTIONS = Object.freeze({ cache: 'no-store' });

const defaultSnapshot = Object.freeze({
  profile: null,
  groupSettings: null,
  components: [],
  scales: [],
  scaleImages: [],
  componentUnavailability: null,
  myUnavailability: null,
    meta: {
      version: APP_DATA_CACHE_VERSION,
      namespace: '',
      lastSyncedAt: null,
      lastSyncStatus: 'idle',
      storageMode: APP_DATA_CACHE_STORAGE_MODES.full
    }
  });

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getInitials(value) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return '?';
  }

  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

function normalizeNamespacePart(value) {
  return normalizeString(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'default';
}

function resolveAuthContextNamespace(authSession) {
  const userId = normalizeNamespacePart(authSession?.user?.id || authSession?.user?._id || authSession?.user?.email || authSession?.user?.username);
  const audience = normalizeNamespacePart(authSession?.audience || 'unknown');
  const role = normalizeNamespacePart(authSession?.role || 'unknown');
  const sessionId = normalizeNamespacePart(authSession?.session?.id || authSession?.session?.sessionId || authSession?.claims?.sid || 'anonymous');

  return [audience, role, userId, sessionId].join(':');
}

function normalizeProfile(payload) {
  const source =
    (payload?.profile && typeof payload.profile === 'object' && payload.profile) ||
    (payload?.item && typeof payload.item === 'object' && payload.item) ||
    (payload?.user && typeof payload.user === 'object' && payload.user) ||
    (payload && typeof payload === 'object' ? payload : null);

  if (!source) {
    return null;
  }

  return {
    name: normalizeString(source.name || source.fullName || source.displayName || source.username),
    photo: normalizeString(source.photoDataUrl || source.photo || source.photoUrl || source.avatarUrl)
  };
}

function normalizeComponent(item, index) {
  const id = normalizeString(item?.id) || normalizeString(item?._id) || `component-${index}`;
  const name =
    normalizeString(item?.fullName) ||
    normalizeString(item?.name) ||
    normalizeString(item?.displayName) ||
    'Componente sem nome';
  const photo =
    normalizeString(item?.photoDataUrl) ||
    normalizeString(item?.photoUrl) ||
    normalizeString(item?.photo) ||
    '';
  const isActive = typeof item?.isActive === 'boolean' ? item.isActive : true;
  const categoryTagIds = Array.isArray(item?.categoryTagIds)
    ? item.categoryTagIds.filter((entry) => typeof entry === 'string' && entry.trim())
    : [];

  return { id, name, photo, isActive, categoryTagIds };
}

function normalizeComponentCatalog(items) {
  const map = new Map();

  (Array.isArray(items) ? items : []).forEach((item, index) => {
    const normalized = normalizeComponent(item, index);
    map.set(normalized.id, normalized);
  });

  return map;
}

function normalizePermissionComponentIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map((entry) => normalizeString(entry)).filter(Boolean)));
}

function normalizeImageAttachment(value, { fallbackSourceScaleId = '', fallbackSourceScaleLabel = '' } = {}) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const src = normalizeString(value?.src);
  if (!src) {
    return null;
  }

  const fallbackIdSeed = [value?.sourceScaleId, src]
    .map((entry) => normalizeString(entry))
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  return {
    id: normalizeString(value?.id) || (fallbackIdSeed ? `scale-image-${fallbackIdSeed}` : 'scale-image'),
    src,
    alt: normalizeString(value?.alt) || 'Imagem da escala',
    label: normalizeString(value?.label) || 'Imagem da escala',
    description: normalizeString(value?.description),
    sourceScaleId: normalizeString(value?.sourceScaleId) || fallbackSourceScaleId,
    sourceScaleLabel: normalizeString(value?.sourceScaleLabel) || fallbackSourceScaleLabel
  };
}

function normalizeScales(scaleItems, componentsById) {
  if (!Array.isArray(scaleItems)) {
    return [];
  }

  return scaleItems.map((scale, index) => {
    const scaleId = normalizeString(scale?.id) || normalizeString(scale?._id) || `scale-${index}`;
    const scaleComponents = Array.isArray(scale?.components) ? scale.components : [];
    const members = scaleComponents.map((item, memberIndex) => {
      const componentId = normalizeString(item?.componentId) || `component-${memberIndex}`;
      const componentData = componentsById.get(componentId);
      const role = normalizeString(item?.function) || 'Sem funcao definida';
      const isLeader = role.toLowerCase().includes('lider');

      return {
        id: componentId,
        name: componentData?.name || 'Componente nao encontrado',
        role,
        photo: componentData?.photo || '',
        initials: getInitials(componentData?.name || 'Componente'),
        isLeader
      };
    });

    const date = normalizeString(scale?.date);
    const shift = normalizeString(scale?.shift) || 'Turno nao informado';
    const imageAttachment = normalizeImageAttachment(scale?.imageAttachment, {
      fallbackSourceScaleId: scaleId,
      fallbackSourceScaleLabel: `${date || 'Data nao informada'} - ${shift}`
    });

    return {
      id: scaleId,
      date,
      shift,
      categoryTagId: normalizeString(scale?.categoryTagId) || 'louvor',
      canEdit: scale?.canEdit !== false,
      members,
      playlist: Array.isArray(scale?.playlist) ? scale.playlist : [],
      playlistEditorComponentIds: normalizePermissionComponentIds(scale?.playlistEditorComponentIds),
      imageEditorComponentIds: normalizePermissionComponentIds(scale?.imageEditorComponentIds),
      messages: Array.isArray(scale?.messages) ? scale.messages : [],
      imageAttachment
    };
  });
}

function normalizeScaleImages(items) {
  return (Array.isArray(items) ? items : []).map((image, index) =>
    normalizeImageAttachment(image, {
      fallbackSourceScaleId: `source-${index}`,
      fallbackSourceScaleLabel: 'Imagem reutilizavel'
    })
  ).filter(Boolean);
}

function normalizeStoredSnapshot(rawSnapshot) {
  const source = rawSnapshot && typeof rawSnapshot === 'object' ? rawSnapshot : {};
  const meta = source.meta && typeof source.meta === 'object' ? source.meta : {};

  return {
    profile: normalizeProfile(source.profile),
    groupSettings: source.groupSettings && typeof source.groupSettings === 'object' ? source.groupSettings : null,
    components: Array.isArray(source.components) ? source.components : [],
    scales: Array.isArray(source.scales) ? source.scales : [],
    scaleImages: Array.isArray(source.scaleImages) ? source.scaleImages : [],
    componentUnavailability:
      source.componentUnavailability && typeof source.componentUnavailability === 'object'
        ? source.componentUnavailability
        : null,
    myUnavailability:
      source.myUnavailability && typeof source.myUnavailability === 'object'
        ? source.myUnavailability
        : null,
    meta: {
      version: meta.version === APP_DATA_CACHE_VERSION ? meta.version : APP_DATA_CACHE_VERSION,
      namespace: normalizeString(meta.namespace),
      lastSyncedAt: typeof meta.lastSyncedAt === 'string' ? meta.lastSyncedAt : null,
      lastSyncStatus: meta.lastSyncStatus === 'error' ? 'error' : 'success',
      storageMode: meta.storageMode === APP_DATA_CACHE_STORAGE_MODES.compact || meta.storageMode === APP_DATA_CACHE_STORAGE_MODES.minimal
        ? meta.storageMode
        : APP_DATA_CACHE_STORAGE_MODES.full
    }
  };
}

function readStoredSnapshot(namespace) {
  if (typeof window === 'undefined') {
    return { ...defaultSnapshot };
  }

  try {
    const raw = window.localStorage.getItem(APP_DATA_CACHE_STORAGE_KEY);
    if (!raw) {
      return { ...defaultSnapshot, meta: { ...defaultSnapshot.meta, namespace } };
    }

    const parsed = normalizeStoredSnapshot(JSON.parse(raw));
    if (parsed.meta.namespace && parsed.meta.namespace !== namespace) {
      return { ...defaultSnapshot, meta: { ...defaultSnapshot.meta, namespace } };
    }

    const sanitizedSnapshot = removeScaleImageDataFromSnapshot(parsed);

    try {
      window.localStorage.setItem(APP_DATA_CACHE_STORAGE_KEY, JSON.stringify(sanitizedSnapshot));
    } catch {
      // A copia em memoria segue sanitizada mesmo se o navegador recusar a migracao do cache legado.
    }

    return sanitizedSnapshot;
  } catch {
    return { ...defaultSnapshot, meta: { ...defaultSnapshot.meta, namespace } };
  }
}

function buildScaleImageLibrary(scales, scaleImages) {
  const fromScales = (Array.isArray(scales) ? scales : [])
    .map((scale) => scale?.imageAttachment)
    .filter(Boolean)
    .map((image, index) =>
      normalizeImageAttachment(image, {
        fallbackSourceScaleId: normalizeString(image?.sourceScaleId) || `scale-${index}`,
        fallbackSourceScaleLabel: normalizeString(image?.sourceScaleLabel) || 'Imagem da escala'
      })
    )
    .filter(Boolean);

  const merged = [...fromScales, ...(Array.isArray(scaleImages) ? scaleImages : [])];
  const seen = new Set();

  return merged.filter((item) => {
    const key = item.id || item.src;
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function filterScalesByTimeScope(scales, timeScope) {
  if (timeScope === CURRENT_AND_FUTURE_TIME_SCOPE) {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return scales.filter((scale) => normalizeString(scale.date) >= todayIso);
  }

  return scales;
}

const AppDataCacheContext = createContext(null);

export function AppDataCacheProvider({ children }) {
  const { isLoading: isAuthLoading, isAuthenticated, audience, role, user, session, claims } = useAuthSession();
  const [snapshot, setSnapshot] = useState(() => ({ ...defaultSnapshot }));
  const [isHydrating, setIsHydrating] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const namespaceRef = useRef('');
  const inFlightRefreshRef = useRef(null);

  const persistSnapshot = useCallback((nextSnapshot, namespace) => {
    const runtimeSnapshot = normalizeStoredSnapshot(nextSnapshot);
    setSnapshot(runtimeSnapshot);

    if (typeof window !== 'undefined') {
      writeAppDataCacheWithFallback(window.localStorage, APP_DATA_CACHE_STORAGE_KEY, runtimeSnapshot, namespace, {
        version: APP_DATA_CACHE_VERSION
      });
    }

    return runtimeSnapshot;
  }, []);

  const clearCache = useCallback(() => {
    setSnapshot({ ...defaultSnapshot });
    setError('');
    setIsRefreshing(false);
    setIsHydrating(false);
    if (typeof window !== 'undefined') {
      clearClientSessionData();
      window.localStorage.removeItem(APP_DATA_CACHE_STORAGE_KEY);
      window.sessionStorage.removeItem(APP_DATA_CACHE_STORAGE_KEY);
    }
  }, []);

  const hydrateRemoteData = useCallback(async (namespace, options = {}) => {
    const { bypassFetchCache = false } = options;
    if (!namespace) {
      return null;
    }

    const requestOptions = bypassFetchCache ? APP_DATA_REMOTE_REFRESH_FETCH_OPTIONS : APP_DATA_REMOTE_FETCH_OPTIONS;
    const shouldLoadGroupedComponentUnavailability = canHydrateGroupedComponentUnavailability(audience);
    const [profilePayload, groupSettingsPayload, componentsPayload, scalesPayload, scaleImagesPayload, componentUnavailabilityPayload, myUnavailabilityPayload] =
      await Promise.all([
        requestJson('/api/auth/profile', requestOptions),
        requestJson('/api/group-settings', requestOptions),
        requestJson('/api/components?limit=100', requestOptions),
        requestJson(`/api/scales?limit=100&timeScope=${encodeURIComponent('all')}`, APP_DATA_REMOTE_REFRESH_FETCH_OPTIONS),
        requestJson('/api/scales/images', APP_DATA_REMOTE_REFRESH_FETCH_OPTIONS),
        shouldLoadGroupedComponentUnavailability
          ? requestJson('/api/components/unavailability', requestOptions)
          : Promise.resolve({ items: [] }),
        requestJson('/api/components/me/unavailability', requestOptions)
      ]);

    const componentsById = normalizeComponentCatalog(componentsPayload?.items);
    const scales = normalizeScales(Array.isArray(scalesPayload?.items) ? scalesPayload.items : [], componentsById);
    const groupSettings = groupSettingsPayload?.item && typeof groupSettingsPayload.item === 'object'
      ? groupSettingsPayload.item
      : null;
    const componentUnavailability = Array.isArray(componentUnavailabilityPayload?.items)
      ? componentUnavailabilityPayload.items
      : [];
    const myUnavailability = myUnavailabilityPayload?.item && typeof myUnavailabilityPayload.item === 'object'
      ? myUnavailabilityPayload.item
      : null;

    return persistSnapshot({
      profile: normalizeProfile(profilePayload),
      groupSettings,
      components: Array.from(componentsById.values()),
      scales,
      scaleImages: normalizeScaleImages(scaleImagesPayload?.items),
      componentUnavailability,
      myUnavailability,
      meta: {
        version: APP_DATA_CACHE_VERSION,
        namespace,
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'success'
      }
    }, namespace);
  }, [audience, persistSnapshot]);

  const hydrateRemoteScaleData = useCallback(async (baseSnapshot) => {
    const [scalesPayload, scaleImagesPayload] = await Promise.all([
      requestJson(`/api/scales?limit=100&timeScope=${encodeURIComponent('all')}`, APP_DATA_REMOTE_REFRESH_FETCH_OPTIONS),
      requestJson('/api/scales/images', APP_DATA_REMOTE_REFRESH_FETCH_OPTIONS)
    ]);
    const componentsById = normalizeComponentCatalog(baseSnapshot?.components);

    return normalizeStoredSnapshot({
      ...baseSnapshot,
      scales: normalizeScales(Array.isArray(scalesPayload?.items) ? scalesPayload.items : [], componentsById),
      scaleImages: normalizeScaleImages(scaleImagesPayload?.items)
    });
  }, []);

  const refreshAppData = useCallback(async () => {
    if (!namespaceRef.current || !isAuthenticated) {
      return { ok: false, reason: 'not-authenticated' };
    }

    if (inFlightRefreshRef.current) {
      return inFlightRefreshRef.current;
    }

    setIsRefreshing(true);
    setError('');

    const refreshPromise = hydrateRemoteData(namespaceRef.current, { bypassFetchCache: true })
      .then((nextSnapshot) => {
        setIsRefreshing(false);
        return { ok: true, snapshot: nextSnapshot };
      })
      .catch((refreshError) => {
        setIsRefreshing(false);
        const message = refreshError instanceof Error ? refreshError.message : 'Nao foi possivel atualizar os dados agora.';
        setError(message);
        return { ok: false, reason: message };
      })
      .finally(() => {
        inFlightRefreshRef.current = null;
      });

    inFlightRefreshRef.current = refreshPromise;
    return refreshPromise;
  }, [hydrateRemoteData, isAuthenticated]);

  useEffect(() => {
    const namespace = isAuthenticated ? resolveAuthContextNamespace({ audience, role, user, session, claims }) : '';
    namespaceRef.current = namespace;

    if (isAuthLoading) {
      return;
    }

    if (!isAuthenticated) {
      clearCache();
      return;
    }

    setIsHydrating(true);
    setError('');

    const storedSnapshot = readStoredSnapshot(namespace);
    setSnapshot(storedSnapshot);

    if (isAppDataSnapshotFresh(storedSnapshot, namespace)) {
      let cancelled = false;

      hydrateRemoteScaleData(storedSnapshot)
        .then((nextSnapshot) => {
          if (!cancelled) {
            setSnapshot(nextSnapshot);
          }
        })
        .catch((hydrateError) => {
          if (!cancelled) {
            const message = hydrateError instanceof Error ? hydrateError.message : 'Nao foi possivel sincronizar as escalas.';
            setError(message);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsHydrating(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    hydrateRemoteData(namespace)
      .catch((hydrateError) => {
        if (cancelled) {
          return null;
        }

        const message = hydrateError instanceof Error ? hydrateError.message : 'Nao foi possivel sincronizar os dados do app.';
        setError(message);
        setSnapshot((current) => ({
          ...current,
          meta: { ...current.meta, namespace, lastSyncStatus: 'error' }
        }));
        return null;
      })
      .finally(() => {
        if (!cancelled) {
          setIsHydrating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [audience, claims, clearCache, hydrateRemoteData, hydrateRemoteScaleData, isAuthLoading, isAuthenticated, role, session, user]);

  useEffect(() => {
    if (isAuthenticated || isAuthLoading) {
      return;
    }

    namespaceRef.current = '';
    setSnapshot({ ...defaultSnapshot });
    setError('');
    setIsHydrating(false);
    setIsRefreshing(false);
  }, [isAuthLoading, isAuthenticated]);

  const value = useMemo(() => {
    const currentComponents = snapshot.components;
    const currentScales = snapshot.scales;

    return {
      isHydrating,
      isRefreshing,
      error,
      lastSyncedAt: snapshot.meta.lastSyncedAt,
      lastSyncStatus: snapshot.meta.lastSyncStatus,
      profile: snapshot.profile,
      groupSettings: snapshot.groupSettings,
      components: currentComponents,
      scales: currentScales,
      scaleImages: buildScaleImageLibrary(currentScales, snapshot.scaleImages),
      componentUnavailability: snapshot.componentUnavailability,
      myUnavailability: snapshot.myUnavailability,
      getScalesByTimeScope: (timeScope) => filterScalesByTimeScope(currentScales, timeScope),
      refreshAppData,
      clearAppCache: clearCache
    };
  }, [
    clearCache,
    error,
    isHydrating,
    isRefreshing,
    refreshAppData,
    snapshot.componentUnavailability,
    snapshot.components,
    snapshot.groupSettings,
    snapshot.meta.lastSyncStatus,
    snapshot.meta.lastSyncedAt,
    snapshot.myUnavailability,
    snapshot.profile,
    snapshot.scaleImages,
    snapshot.scales
  ]);

  return <AppDataCacheContext.Provider value={value}>{children}</AppDataCacheContext.Provider>;
}

export function useAppDataCache() {
  const context = useContext(AppDataCacheContext);

  if (!context) {
    throw new Error('useAppDataCache must be used within an AppDataCacheProvider.');
  }

  return context;
}
