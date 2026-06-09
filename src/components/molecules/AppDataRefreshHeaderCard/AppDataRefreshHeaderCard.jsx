'use client';

import AppDataRefreshButton from '@/components/molecules/AppDataRefreshButton/AppDataRefreshButton';
import styles from './AppDataRefreshHeaderCard.module.css';

export default function AppDataRefreshHeaderCard({
  kicker = 'Atualizacao',
  title = 'Recarregue a lista com um toque',
  description = 'Mantenha a tela sincronizada sem sair do contexto.',
  buttonLabel = 'Atualizar dados',
  buttonVariant = 'accent',
  onRefresh,
  isRefreshing = false
}) {
  if (typeof onRefresh !== 'function') {
    return null;
  }

  return (
    <div className={styles.card}>
      <p className={styles.kicker}>{kicker}</p>
      <strong>{title}</strong>
      <p className={styles.description}>{description}</p>
      <AppDataRefreshButton
        onClick={onRefresh}
        isRefreshing={isRefreshing}
        label={buttonLabel}
        variant={buttonVariant}
      />
    </div>
  );
}
