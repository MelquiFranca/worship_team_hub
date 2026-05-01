'use client';

import { useEffect, useState } from 'react';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useToast } from '@/context/ToastContext';
import styles from './GlobalToastHost.module.css';

function resolveA11yBySeverity(severity) {
  if (severity === 'error' || severity === 'warning') {
    return { role: 'alert', ariaLive: 'assertive' };
  }

  return { role: 'status', ariaLive: 'polite' };
}

export default function GlobalToastHost() {
  const { toasts, dismissToast } = useToast();
  const { isLoading, isAuthenticated } = useAuthSession();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (toasts.length === 0) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => clearInterval(intervalId);
  }, [toasts.length]);

  if (isLoading || !isAuthenticated || toasts.length === 0) {
    return null;
  }

  return (
    <div className={styles.shell} aria-label="Notificacoes">
      <div className={styles.stack}>
        {toasts.map((toast) => {
          const a11y = resolveA11yBySeverity(toast.severity);
          const elapsedMs = Math.max(0, now - (toast.createdAt || now));
          const remainingMs = Math.max(0, toast.durationMs - elapsedMs);
          const remainingSeconds = (remainingMs / 1000).toFixed(0);

          return (
            <section
              key={toast.id}
              className={`${styles.toast} ${styles[`toast${toast.severity.charAt(0).toUpperCase()}${toast.severity.slice(1)}`]}`}
              role={a11y.role}
              aria-live={a11y.ariaLive}
            >
              <div className={styles.content}>
                {toast.title ? <p className={styles.title}>{toast.title}</p> : null}
                <p className={styles.message}>{toast.message}</p>
                <p className={styles.countdown}>Fechando em {remainingSeconds}s</p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => dismissToast(toast.id)}
                aria-label="Fechar notificacao"
              >
                ×
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
