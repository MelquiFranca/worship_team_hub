'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const AUTO_CLOSE_MS = 5000;
const DEFAULT_SEVERITY = 'info';
const TOAST_SEVERITIES = new Set(['info', 'success', 'warning', 'error']);

const ToastContext = createContext(null);

function normalizeSeverity(severity) {
  if (TOAST_SEVERITIES.has(severity)) {
    return severity;
  }

  return DEFAULT_SEVERITY;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());
  const nextIdRef = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));

    const timerId = timersRef.current.get(id);
    if (timerId) {
      clearTimeout(timerId);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback((input) => {
    const payload = typeof input === 'string' ? { message: input } : input || {};
    const message = typeof payload.message === 'string' ? payload.message.trim() : '';

    if (!message) {
      return null;
    }

    const id = String(nextIdRef.current++);
    const toast = {
      id,
      message,
      severity: normalizeSeverity(payload.severity),
      title: typeof payload.title === 'string' ? payload.title.trim() : '',
      durationMs: typeof payload.durationMs === 'number' && payload.durationMs > 0 ? payload.durationMs : AUTO_CLOSE_MS,
      createdAt: Date.now()
    };

    setToasts((current) => [...current, toast]);

    const timerId = setTimeout(() => {
      dismissToast(id);
    }, toast.durationMs);

    timersRef.current.set(id, timerId);
    return id;
  }, [dismissToast]);

  const clearToasts = useCallback(() => {
    timersRef.current.forEach((timerId) => clearTimeout(timerId));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const value = useMemo(() => ({
    toasts,
    showToast,
    dismissToast,
    clearToasts
  }), [toasts, showToast, dismissToast, clearToasts]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.');
  }

  return context;
}

export function useActionFeedback() {
  const { showToast } = useToast();

  const showActionFeedback = useCallback(
    ({ type = 'success', message = '', title = '' } = {}) => {
      const normalizedType = type === 'error' ? 'error' : 'success';
      const normalizedMessage = typeof message === 'string' ? message.trim() : '';

      if (!normalizedMessage) {
        return null;
      }

      return showToast({
        severity: normalizedType,
        title,
        message: normalizedMessage,
        durationMs: AUTO_CLOSE_MS
      });
    },
    [showToast]
  );

  return { showActionFeedback };
}
