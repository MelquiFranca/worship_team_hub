'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  applyGroupThemeToDocument,
  GROUP_THEME_FALLBACK,
  GROUP_THEME_OPTIONS,
  resolveGroupTheme
} from '@/theme/groupTheme';
import { GROUP_FUNCTION_OPTIONS } from '@/data/groupFunctions';
import { CLIENT_AUTH_STORAGE_KEYS } from '@/lib/auth/clientSessionCleanup';
import { requestJson } from '@/lib/api/http';

export const GROUP_SETTINGS_STORAGE_KEY = CLIENT_AUTH_STORAGE_KEYS.groupSettings;

export const groupFunctionOptions = GROUP_FUNCTION_OPTIONS;

const BASE_FUNCTION_OPTIONS = GROUP_FUNCTION_OPTIONS.map((option) => ({
  id: option.id,
  label: option.label,
  hint: option.hint || 'Funcao do grupo',
  isCustom: false
}));

const defaultGroupSettings = Object.freeze({
  name: 'Equipe principal',
  photo: '',
  functionOptions: BASE_FUNCTION_OPTIONS,
  availableFunctions: ['vocal', 'guitarra', 'teclado'],
  themeName: GROUP_THEME_FALLBACK
});

function normalizeNameForStorage(value) {
  if (typeof value !== 'string') {
    return defaultGroupSettings.name;
  }

  const trimmed = value.trim();
  return trimmed || defaultGroupSettings.name;
}

function normalizeNameForState(value) {
  return typeof value === 'string' ? value : '';
}

function normalizePhotoForState(value) {
  return typeof value === 'string' ? value : '';
}

function isImageDataUrl(value) {
  return typeof value === 'string' && value.startsWith('data:image/');
}

function normalizeFunctionLabel(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeFunctionHint(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toFunctionIdSeed(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

function normalizeFunctionOptions(value) {
  const source = Array.isArray(value) ? value : defaultGroupSettings.functionOptions;
  const options = [];
  const seenIds = new Set();

  source.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    const label = normalizeFunctionLabel(item.label);
    const hint = normalizeFunctionHint(item.hint) || 'Funcao personalizada';
    const rawId = typeof item.id === 'string' ? item.id.trim() : '';
    const generatedId = toFunctionIdSeed(label);
    const id = rawId || generatedId;

    if (!id || !label || seenIds.has(id)) {
      return;
    }

    seenIds.add(id);
    options.push({
      id,
      label,
      hint,
      isCustom: Boolean(item.isCustom)
    });
  });

  if (!options.length) {
    return defaultGroupSettings.functionOptions;
  }

  return options;
}

function normalizeAvailableFunctions(value, functionOptions = defaultGroupSettings.functionOptions) {
  const validIds = new Set(functionOptions.map((option) => option.id));
  const source = Array.isArray(value) ? value : defaultGroupSettings.availableFunctions;
  const filtered = [];

  source.forEach((item) => {
    if (typeof item === 'string' && validIds.has(item) && !filtered.includes(item)) {
      filtered.push(item);
    }
  });

  if (!filtered.length && functionOptions.length > 0) {
    filtered.push(functionOptions[0].id);
  }

  return filtered;
}

function normalizeThemeName(value) {
  const resolved = resolveGroupTheme(value);
  return resolved.name;
}

export function normalizeStoredGroupSettings(rawSettings) {
  const source = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const functionOptions = normalizeFunctionOptions(source.functionOptions);

  return {
    name: normalizeNameForStorage(source.name),
    photo: normalizePhotoForState(source.photo),
    functionOptions,
    availableFunctions: normalizeAvailableFunctions(source.availableFunctions, functionOptions),
    themeName: normalizeThemeName(source.themeName)
  };
}

function normalizeApiGroupSettings(payload) {
  const source = payload?.item && typeof payload.item === 'object' ? payload.item : payload;

  if (!source || typeof source !== 'object') {
    return null;
  }

  const photoDataUrl = normalizePhotoForState(source.photoDataUrl);
  const photo = normalizePhotoForState(source.photo);
  const photoUrl = normalizePhotoForState(source.photoUrl);

  return normalizeStoredGroupSettings({
    name: source.name,
    photo: photoDataUrl || photo || photoUrl,
    functionOptions: source.functionOptions,
    availableFunctions: source.availableFunctions,
    themeName: source.themeName
  });
}

function readStoredSettings() {
  if (typeof window === 'undefined') {
    return defaultGroupSettings;
  }

  try {
    const raw = window.localStorage.getItem(GROUP_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return defaultGroupSettings;
    }

    return normalizeStoredGroupSettings(JSON.parse(raw));
  } catch {
    return defaultGroupSettings;
  }
}

function settingsEqual(left, right) {
  return (
    left.name === right.name &&
    left.photo === right.photo &&
    left.themeName === right.themeName &&
    left.functionOptions.length === right.functionOptions.length &&
    left.functionOptions.every((item, index) => {
      const rightItem = right.functionOptions[index];

      return (
        item.id === rightItem?.id &&
        item.label === rightItem?.label &&
        item.hint === rightItem?.hint &&
        item.isCustom === rightItem?.isCustom
      );
    }) &&
    left.availableFunctions.length === right.availableFunctions.length &&
    left.availableFunctions.every((item, index) => item === right.availableFunctions[index])
  );
}

function validateGroupSettings(settings) {
  const errors = {};

  if (settings.name.trim().length < 3 || settings.name.trim().length > 48) {
    errors.name = 'O nome do grupo deve ter entre 3 e 48 caracteres.';
  }

  if (!settings.functionOptions.length) {
    errors.functionOptions = 'Cadastre ao menos um tipo de funcao.';
  }

  if (!settings.availableFunctions.length) {
    errors.availableFunctions = 'Selecione ao menos uma funcao.';
  }

  return errors;
}

const GroupSettingsContext = createContext(null);

export function GroupSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultGroupSettings);
  const [savedSettings, setSavedSettings] = useState(defaultGroupSettings);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [feedback, setFeedback] = useState({ type: 'idle', message: '' });

  useEffect(() => {
    const storedSettings = readStoredSettings();
    setSettings(storedSettings);
    setSavedSettings(storedSettings);
    setIsReady(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadRemoteGroupSettings() {
      try {
        const payload = await requestJson('/api/group-settings', {
          method: 'GET',
          cache: 'no-store'
        });
        const normalized = normalizeApiGroupSettings(payload);

        if (!isMounted || !normalized) {
          return;
        }

        setSettings(normalized);
        setSavedSettings(normalized);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(GROUP_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
        }
      } catch {
        // Fallback para storage local quando API nao estiver disponivel.
      }
    }

    if (isReady) {
      loadRemoteGroupSettings();
    }

    return () => {
      isMounted = false;
    };
  }, [isReady]);

  useEffect(() => {
    applyGroupThemeToDocument(settings.themeName);
  }, [settings.themeName]);

  const validationErrors = useMemo(() => validateGroupSettings(settings), [settings]);
  const isDirty = useMemo(() => !settingsEqual(settings, savedSettings), [settings, savedSettings]);

  const updateSettings = useCallback((patch) => {
    setSettings((current) => {
      const nextValue = typeof patch === 'function' ? patch(current) : patch;
      const nextSettings = { ...current, ...nextValue };
      const functionOptions = normalizeFunctionOptions(nextSettings.functionOptions);

      return {
        name: normalizeNameForState(nextSettings.name),
        photo: normalizePhotoForState(nextSettings.photo),
        functionOptions,
        availableFunctions: normalizeAvailableFunctions(nextSettings.availableFunctions, functionOptions),
        themeName: normalizeThemeName(nextSettings.themeName)
      };
    });
    setFeedback({ type: 'idle', message: '' });
  }, []);

  const setGroupName = useCallback((name) => {
    updateSettings({ name });
  }, [updateSettings]);

  const setGroupPhoto = useCallback((photo) => {
    updateSettings({ photo });
  }, [updateSettings]);

  const setThemeName = useCallback((themeName) => {
    updateSettings({ themeName });
  }, [updateSettings]);

  const setAvailableFunctions = useCallback((availableFunctions) => {
    updateSettings({ availableFunctions });
  }, [updateSettings]);

  const toggleAvailableFunction = useCallback((functionId) => {
    setSettings((current) => {
      const nextFunctions = current.availableFunctions.includes(functionId)
        ? current.availableFunctions.filter((item) => item !== functionId)
        : [...current.availableFunctions, functionId];

      if (nextFunctions.length === 0) {
        return current;
      }

      return {
        ...current,
        availableFunctions: normalizeAvailableFunctions(nextFunctions, current.functionOptions)
      };
    });
    setFeedback({ type: 'idle', message: '' });
  }, []);

  const addFunctionOption = useCallback((label, hint = '') => {
    const normalizedLabel = normalizeFunctionLabel(label);
    const normalizedHint = normalizeFunctionHint(hint) || 'Funcao personalizada';

    if (normalizedLabel.length < 2) {
      return { ok: false, message: 'Informe um nome de funcao com pelo menos 2 caracteres.' };
    }

    let result = { ok: false, message: 'Nao foi possivel adicionar a funcao.' };

    setSettings((current) => {
      const currentOptions = normalizeFunctionOptions(current.functionOptions);
      const existingByLabel = currentOptions.find(
        (option) => option.label.toLowerCase() === normalizedLabel.toLowerCase()
      );

      if (existingByLabel) {
        result = { ok: false, message: 'Ja existe uma funcao com este nome.' };
        return current;
      }

      const baseId = toFunctionIdSeed(normalizedLabel) || `funcao-${Date.now()}`;
      const usedIds = new Set(currentOptions.map((option) => option.id));
      let candidateId = baseId;
      let counter = 2;

      while (usedIds.has(candidateId)) {
        candidateId = `${baseId}-${counter}`;
        counter += 1;
      }

      const nextOptions = [
        ...currentOptions,
        {
          id: candidateId,
          label: normalizedLabel,
          hint: normalizedHint,
          isCustom: true
        }
      ];

      result = { ok: true, id: candidateId };

      return {
        ...current,
        functionOptions: nextOptions,
        availableFunctions: normalizeAvailableFunctions([...current.availableFunctions, candidateId], nextOptions)
      };
    });

    if (result.ok) {
      setFeedback({ type: 'idle', message: '' });
    }

    return result;
  }, []);

  const removeFunctionOption = useCallback((functionId) => {
    const normalizedId = typeof functionId === 'string' ? functionId.trim() : '';

    if (!normalizedId) {
      return { ok: false, message: 'Funcao invalida.' };
    }

    let result = { ok: false, message: 'Nao foi possivel excluir a funcao.' };

    setSettings((current) => {
      const currentOptions = normalizeFunctionOptions(current.functionOptions);
      const target = currentOptions.find((option) => option.id === normalizedId);

      if (!target) {
        result = { ok: false, message: 'Funcao nao encontrada.' };
        return current;
      }

      if (!target.isCustom) {
        result = { ok: false, message: 'Somente funcoes personalizadas podem ser excluidas.' };
        return current;
      }

      if (currentOptions.length <= 1) {
        result = { ok: false, message: 'Mantenha ao menos uma funcao cadastrada.' };
        return current;
      }

      const nextOptions = currentOptions.filter((option) => option.id !== normalizedId);
      const nextSelected = current.availableFunctions.filter((id) => id !== normalizedId);

      result = { ok: true };

      return {
        ...current,
        functionOptions: nextOptions,
        availableFunctions: normalizeAvailableFunctions(nextSelected, nextOptions)
      };
    });

    if (result.ok) {
      setFeedback({ type: 'idle', message: '' });
    }

    return result;
  }, []);

  const saveSettings = useCallback(async () => {
    const currentErrors = validateGroupSettings(settings);

    if (Object.keys(currentErrors).length > 0) {
      const message =
        currentErrors.name ||
        currentErrors.functionOptions ||
        currentErrors.availableFunctions ||
        'Corrija os erros antes de salvar.';
      setFeedback({ type: 'error', message });
      return { ok: false, errors: currentErrors };
    }

    const normalized = normalizeStoredGroupSettings(settings);

    setIsSaving(true);

    try {
      const body = {
        name: normalized.name,
        functionOptions: normalized.functionOptions,
        availableFunctions: normalized.availableFunctions,
        themeName: normalized.themeName
      };

      if (normalized.photo) {
        if (isImageDataUrl(normalized.photo)) {
          body.photoDataUrl = normalized.photo;
          body.photoUrl = '';
        } else {
          body.photoUrl = normalized.photo;
          body.photoProvided = true;
        }
      } else {
        body.photoDataUrl = null;
        body.photoUrl = '';
      }

      const payload = await requestJson('/api/group-settings', {
        method: 'PATCH',
        body
      });
      const savedFromApi = normalizeApiGroupSettings(payload) || normalized;

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(GROUP_SETTINGS_STORAGE_KEY, JSON.stringify(savedFromApi));
      }

      setSettings(savedFromApi);
      setSavedSettings(savedFromApi);
      setLastSavedAt(new Date());
      setFeedback({ type: 'success', message: 'Configuracoes salvas com sucesso.' });
      return { ok: true, errors: {} };
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Nao foi possivel salvar as configuracoes agora.'
      });
      return { ok: false, errors: {} };
    } finally {
      setIsSaving(false);
    }
  }, [settings]);

  const resetSettings = useCallback(() => {
    setSettings(defaultGroupSettings);
    setFeedback({ type: 'idle', message: '' });
  }, []);

  const value = useMemo(
    () => ({
      settings,
      savedSettings,
      isReady,
      isSaving,
      isDirty,
      lastSavedAt,
      feedback,
      validationErrors,
      themeOptions: GROUP_THEME_OPTIONS,
      availableFunctionOptions: settings.functionOptions,
      functionOptions: settings.functionOptions,
      groupThemeOptions: GROUP_THEME_OPTIONS,
      setGroupName,
      setGroupPhoto,
      setThemeName,
      setAvailableFunctions,
      toggleAvailableFunction,
      addFunctionOption,
      removeFunctionOption,
      saveSettings,
      resetSettings,
      applyTheme: applyGroupThemeToDocument
    }),
    [
      settings,
      savedSettings,
      isReady,
      isSaving,
      isDirty,
      lastSavedAt,
      feedback,
      validationErrors,
      setGroupName,
      setGroupPhoto,
      setThemeName,
      setAvailableFunctions,
      toggleAvailableFunction,
      addFunctionOption,
      removeFunctionOption,
      saveSettings,
      resetSettings
    ]
  );

  return <GroupSettingsContext.Provider value={value}>{children}</GroupSettingsContext.Provider>;
}

export function useGroupSettings() {
  const context = useContext(GroupSettingsContext);

  if (!context) {
    throw new Error('useGroupSettings must be used within a GroupSettingsProvider.');
  }

  return context;
}
