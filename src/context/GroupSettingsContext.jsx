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

export const GROUP_SETTINGS_STORAGE_KEY = CLIENT_AUTH_STORAGE_KEYS.groupSettings;

export const groupFunctionOptions = GROUP_FUNCTION_OPTIONS;

const defaultGroupSettings = Object.freeze({
  name: 'Equipe principal',
  photo: '',
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

function normalizeAvailableFunctions(value) {
  const validIds = new Set(groupFunctionOptions.map((option) => option.id));
  const source = Array.isArray(value) ? value : defaultGroupSettings.availableFunctions;
  const filtered = [];

  source.forEach((item) => {
    if (typeof item === 'string' && validIds.has(item) && !filtered.includes(item)) {
      filtered.push(item);
    }
  });

  if (filtered.length === 0) {
    filtered.push(defaultGroupSettings.availableFunctions[0]);
  }

  return filtered;
}

function normalizeThemeName(value) {
  const resolved = resolveGroupTheme(value);
  return resolved.name;
}

export function normalizeStoredGroupSettings(rawSettings) {
  const source = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};

  return {
    name: normalizeNameForStorage(source.name),
    photo: normalizePhotoForState(source.photo),
    availableFunctions: normalizeAvailableFunctions(source.availableFunctions),
    themeName: normalizeThemeName(source.themeName)
  };
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
    left.availableFunctions.length === right.availableFunctions.length &&
    left.availableFunctions.every((item, index) => item === right.availableFunctions[index])
  );
}

function validateGroupSettings(settings) {
  const errors = {};

  if (settings.name.trim().length < 3 || settings.name.trim().length > 48) {
    errors.name = 'O nome do grupo deve ter entre 3 e 48 caracteres.';
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
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [feedback, setFeedback] = useState({ type: 'idle', message: '' });

  useEffect(() => {
    const storedSettings = readStoredSettings();
    setSettings(storedSettings);
    setSavedSettings(storedSettings);
    setIsReady(true);
  }, []);

  useEffect(() => {
    applyGroupThemeToDocument(settings.themeName);
  }, [settings.themeName]);

  const validationErrors = useMemo(() => validateGroupSettings(settings), [settings]);
  const isDirty = useMemo(() => !settingsEqual(settings, savedSettings), [settings, savedSettings]);

  const updateSettings = useCallback((patch) => {
    setSettings((current) => {
      const nextValue = typeof patch === 'function' ? patch(current) : patch;
      const nextSettings = { ...current, ...nextValue };
      return {
        name: normalizeNameForState(nextSettings.name),
        photo: normalizePhotoForState(nextSettings.photo),
        availableFunctions: normalizeAvailableFunctions(nextSettings.availableFunctions),
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
        availableFunctions: nextFunctions
      };
    });
    setFeedback({ type: 'idle', message: '' });
  }, []);

  const saveSettings = useCallback(() => {
    const currentErrors = validateGroupSettings(settings);

    if (Object.keys(currentErrors).length > 0) {
      const message = currentErrors.name || currentErrors.availableFunctions || 'Corrija os erros antes de salvar.';
      setFeedback({ type: 'error', message });
      return { ok: false, errors: currentErrors };
    }

    const normalized = normalizeStoredGroupSettings(settings);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(GROUP_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
    }

    setSettings(normalized);
    setSavedSettings(normalized);
    setLastSavedAt(new Date());
    setFeedback({ type: 'success', message: 'Configuracoes salvas com sucesso.' });
    return { ok: true, errors: {} };
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
      isDirty,
      lastSavedAt,
      feedback,
      validationErrors,
      themeOptions: GROUP_THEME_OPTIONS,
      availableFunctionOptions: groupFunctionOptions,
      groupThemeOptions: GROUP_THEME_OPTIONS,
      setGroupName,
      setGroupPhoto,
      setThemeName,
      setAvailableFunctions,
      toggleAvailableFunction,
      saveSettings,
      resetSettings,
      applyTheme: applyGroupThemeToDocument
    }),
    [
      settings,
      savedSettings,
      isReady,
      isDirty,
      lastSavedAt,
      feedback,
      validationErrors,
      setGroupName,
      setGroupPhoto,
      setThemeName,
      setAvailableFunctions,
      toggleAvailableFunction,
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
