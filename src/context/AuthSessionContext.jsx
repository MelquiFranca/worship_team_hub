'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { clearClientSessionData } from '@/lib/auth/clientSessionCleanup';
import { registerClientPushSubscription } from '@/lib/notifications/registerClientPushSubscription';

const AUTH_ME_ENDPOINT = '/api/auth/me';

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

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
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
  const hasAttemptedPushRegistrationRef = useRef(false);

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
  }, []);

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
    let isActive = true;
    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch(AUTH_ME_ENDPOINT, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal
        });

        const payload = await response.json().catch(() => null);
        const normalized = response.ok ? normalizeAuthSessionPayload(payload) : null;

        if (!isActive) {
          return;
        }

        if (normalized) {
          setIsAuthenticated(true);
          setSession(normalized.session);
          setUser(normalized.user);
          setClaims(normalized.claims);
          setAudience(normalized.audience);
          setRole(normalized.role);
          return;
        }

        clearAuthState({ clearClientData: true });
      } catch (error) {
        if (!isActive || error?.name === 'AbortError') {
          return;
        }

        clearAuthState();
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [clearAuthState]);

  const permissions = useMemo(
    () => buildPermissions({ audience, role, isAuthenticated }),
    [audience, role, isAuthenticated]
  );

  useEffect(() => {
    if (isLoading || !isAuthenticated || !permissions.isComponentApp) {
      if (!isAuthenticated) {
        hasAttemptedPushRegistrationRef.current = false;
      }
      return;
    }

    if (hasAttemptedPushRegistrationRef.current) {
      return;
    }

    hasAttemptedPushRegistrationRef.current = true;

    registerClientPushSubscription().catch(() => {
      // Registro push nao deve quebrar a sessao.
    });
  }, [isLoading, isAuthenticated, permissions.isComponentApp]);

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
      logout
    }),
    [isLoading, isAuthenticated, session, user, claims, audience, role, permissions, logout]
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
