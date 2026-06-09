'use client';

import styles from './AppDataRefreshButton.module.css';

function RefreshCwIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={styles.icon}>
      <path d="M21 12a9 9 0 0 1-15.3 6.4l-1.6 1.6a1 1 0 0 1-1.7-.7V14a1 1 0 0 1 1-1h4.7a1 1 0 0 1 .7 1.7l-1.6 1.6A6 6 0 1 0 18 12a1 1 0 1 1 2 0Zm-18 0A9 9 0 0 1 18.3 5.6l1.6-1.6a1 1 0 0 1 1.7.7V10a1 1 0 0 1-1 1h-4.7a1 1 0 0 1-.7-1.7l1.6-1.6A6 6 0 1 0 6 12a1 1 0 1 1-2 0Z" />
    </svg>
  );
}

export default function AppDataRefreshButton({
  onClick,
  isRefreshing = false,
  label = 'Atualizar',
  compact = false,
  variant = 'default'
}) {
  const visibleLabel = label;
  const buttonClassName = [
    styles.button,
    compact ? styles.buttonCompact : '',
    variant === 'accent' ? styles.buttonAccent : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={buttonClassName}
      onClick={onClick}
      disabled={isRefreshing}
      aria-label={isRefreshing ? 'Atualizando dados' : 'Atualizar dados'}
      title={label}
    >
      <RefreshCwIcon />
      <span className={styles.label}>{isRefreshing ? 'Atualizando' : visibleLabel}</span>
    </button>
  );
}
