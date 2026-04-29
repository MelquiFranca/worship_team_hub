'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { clearClientSessionData } from '@/lib/auth/clientSessionCleanup';
import { requestJson } from '@/lib/api/http';
import {
  isRetryablePushRegistrationReason,
  registerClientPushSubscription
} from '@/lib/notifications/registerClientPushSubscription';

const AUTH_ME_ENDPOINT = '/api/auth/me';
const PUSH_REGISTRATION_RETRY_DELAY_MS = 30000;

const defaultPermissions = Object.freeze({
  isAdminPanel: false,
  isGroupApp: false,
  isComponentApp: false,
  canManageGroup: false,
  canInsertScale: false,
  canInsertComponent: false,
  canNotifyScale: false,
  canEditScale: false,
  canEditComponent: false,
  canSendScaleMessage: false,
  canViewScaleComponents: false,
  canViewScalePlaylist: false,
  canViewScaleImage: false,
  canAccessEditProfile: false,
  canEditProfileName: false
});

const defaultPushNotifications = Object.freeze({
  supported: false,
  permission: 'unsupported',
  isRegistering: false,
  isReady: false,
  lastReason: null
});

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePushPermission(value) {
  if (value === 'granted' || value === 'denied' || value === 'default') {
    return value;
  }

  if (value === 'unsupported') {
    return value;
  }

  return 'default';
}

function buildLeastPrivilegePermissions() {
  return { ...defaultPermissions };
}

function buildPermissions({ audience, role, isAuthenticated }) {
  if (!isAuthenticated) {
    return buildLeastPrivilegePermissions();
  }

  if (audience === 'admin-panel' || role === 'admin') {
    return {
      isAdminPanel: true,
      isGroupApp: false,
      isComponentApp: false,
      canManageGroup: true,
      canInsertScale: true,
      canInsertComponent: true,
      canNotifyScale: true,
      canEditScale: true,
      canEditComponent: true,
      canSendScaleMessage: true,
      canViewScaleComponents: true,
      canViewScalePlaylist: true,
      canViewScaleImage: true,
      canAccessEditProfile: true,
      canEditProfileName: true
    };
  }

  if (audience === 'group-app' || role === 'group_owner') {
    return {
      isAdminPanel: false,
      isGroupApp: true,
      isComponentApp: false,
      canManageGroup: true,
      canInsertScale: true,
      canInsertComponent: true,
      canNotifyScale: true,
      canEditScale: true,
      canEditComponent: true,
      canSendScaleMessage: true,
      canViewScaleComponents: true,
      canViewScalePlaylist: true,
      canViewScaleImage: true,
      canAccessEditProfile: true,
      canEditProfileName: true
    };
  }

  if (audience === 'component-app' || role === 'component') {
    return {
      isAdminPanel: false,
      isGroupApp: false,
      isComponentApp: true,
      canManageGroup: false,
      canInsertScale: false,
      canInsertComponent: false,
      canNotifyScale: false,
      canEditScale: false,
      canEditComponent: false,
      canSendScaleMessage: true,
      canViewScaleComponents: true,
      canViewScalePlaylist: true,
      canViewScaleImage: true,
      canAccessEditProfile: true,
      canEditProfileName: false
    };
  }

  return buildLeastPrivilegePermissions();
}

function normalizeAuthSessionPayload(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const user = data.user && typeof data.user === 'object' ? data.user : null;
  const session = data.session && typeof data.session === 'object' ? data.session : null;
  const claims = data.claims && typeof data.claims === 'object'
    ? data.claims
    : session?.claims && typeof session.claims === 'object'
      ? session.claims
      : null;

  const audience = normalizeString(session?.audience || claims?.aud || claims?.audience);
  const role = normalizeString(user?.role || claims?.role || claims?.roles?.[0]);

  return {
    user,
    session,
    claims,
    audience: audience || null,
    role: role || null
  };
}

const AuthSessionContext = createContext(null);

export function AuthSessionProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState(null);
  const [audience, setAudience] = useState(null);
  const [role, setRole] = useState(null);
  const [pushNotifications, setPushNotifications] = useState(() => ({ ...defaultPushNotifications }));
  const isPushRegistrationInFlightRef = useRef(false);

  const resetPushNotifications = useCallback(() => {
    isPushRegistrationInFlightRef.current = false;
    setPushNotifications({ ...defaultPushNotifications });
  }, []);

  const clearAuthState = useCallback((options = {}) => {
    const { clearClientData = false } = options;

    if (clearClientData) {
      clearClientSessionData();
    }

    setIsAuthenticated(false);
    setSession(null);
    setUser(null);
    setClaims(null);
    setAudience(null);
    setRole(null);
    resetPushNotifications();
  }, [resetPushNotifications]);

  const loadSessionFromServer = useCallback(
    async (options = {}) => {
      const { signal, clearClientDataOnFailure = true, setLoadingState = true } = options;

      if (setLoadingState) {
        setIsLoading(true);
      }

      try {
        const payload = await requestJson(AUTH_ME_ENDPOINT, {
          method: 'GET',
          cache: 'no-store',
          signal
        });
        const normalized = normalizeAuthSessionPayload(payload);

        if (normalized) {
          setIsAuthenticated(true);
          setSession(normalized.session);
          setUser(normalized.user);
          setClaims(normalized.claims);
          setAudience(normalized.audience);
          setRole(normalized.role);
          return true;
        }

        clearAuthState({ clearClientData: clearClientDataOnFailure });
        return false;
      } catch (error) {
        if (error?.name === 'AbortError') {
          return false;
        }

        clearAuthState({ clearClientData: clearClientDataOnFailure });
        return false;
      } finally {
        if (setLoadingState) {
          setIsLoading(false);
        }
      }
    },
    [clearAuthState]
  );

  const refreshSession = useCallback(async () => {
    await loadSessionFromServer({
      clearClientDataOnFailure: true,
      setLoadingState: false
    });
  }, [loadSessionFromServer]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      // O logout no servidor pode falhar sem impedir a limpeza local.
    } finally {
      clearAuthState({ clearClientData: true });
    }
  }, [clearAuthState]);

  useEffect(() => {
    const controller = new AbortController();
    loadSessionFromServer({
      signal: controller.signal,
      clearClientDataOnFailure: true,
      setLoadingState: true
    });

    return () => {
      controller.abort();
    };
  }, [loadSessionFromServer]);

  const permissions = useMemo(
    () => buildPermissions({ audience, role, isAuthenticated }),
    [audience, role, isAuthenticated]
  );

  const attemptPushRegistration = useCallback(
    async (options = {}) => {
      const { requestPermissionIfDefault = false } = options;

      if (isPushRegistrationInFlightRef.current) {
        return { ok: false, reason: 'registration-in-flight' };
      }

      isPushRegistrationInFlightRef.current = true;
      setPushNotifications((current) => ({
        ...current,
        isRegistering: true
      }));

      try {
        const result = await registerClientPushSubscription({ requestPermissionIfDefault });
        const supported = result?.supported !== false;
        const permission = supported ? normalizePushPermission(result?.permission) : 'unsupported';
        const lastReason = result?.ok ? null : normalizeString(result?.reason) || 'unknown';

        setPushNotifications({
          supported,
          permission,
          isRegistering: false,
          isReady: Boolean(result?.ok),
          lastReason
        });

        return result;
      } catch {
        setPushNotifications((current) => ({
          ...current,
          isRegistering: false,
          isReady: false,
          lastReason: 'unexpected-error'
        }));

        return { ok: false, reason: 'unexpected-error' };
      } finally {
        isPushRegistrationInFlightRef.current = false;
      }
    },
    []
  );

  const requestPushNotificationPermission = useCallback(async () => {
    if (isLoading || !isAuthenticated || (!permissions.isComponentApp && !permissions.isGroupApp)) {
      return { ok: false, reason: 'not-eligible' };
    }

    return attemptPushRegistration({ requestPermissionIfDefault: true });
  }, [attemptPushRegistration, isAuthenticated, isLoading, permissions.isComponentApp, permissions.isGroupApp]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || (!permissions.isComponentApp && !permissions.isGroupApp)) {
      resetPushNotifications();
      return;
    }

    attemptPushRegistration({ requestPermissionIfDefault: false });
  }, [
    attemptPushRegistration,
    isAuthenticated,
    isLoading,
    permissions.isComponentApp,
    permissions.isGroupApp,
    resetPushNotifications
  ]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || (!permissions.isComponentApp && !permissions.isGroupApp)) {
      return;
    }

    if (
      pushNotifications.permission !== 'granted' ||
      pushNotifications.isReady ||
      pushNotifications.isRegistering ||
      !isRetryablePushRegistrationReason(pushNotifications.lastReason)
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      attemptPushRegistration({ requestPermissionIfDefault: false });
    }, PUSH_REGISTRATION_RETRY_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    attemptPushRegistration,
    isAuthenticated,
    isLoading,
    permissions.isComponentApp,
    permissions.isGroupApp,
    pushNotifications.isReady,
    pushNotifications.isRegistering,
    pushNotifications.lastReason,
    pushNotifications.permission
  ]);

  const value = useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      session,
      user,
      claims,
      audience,
      role,
      permissions,
      pushNotifications,
      requestPushNotificationPermission,
      logout,
      refreshSession
    }),
    [
      isLoading,
      isAuthenticated,
      session,
      user,
      claims,
      audience,
      role,
      permissions,
      pushNotifications,
      requestPushNotificationPermission,
      logout,
      refreshSession
    ]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider.');
  }

  return context;
}
