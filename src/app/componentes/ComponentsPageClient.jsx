'use client';

import ComponentsGallery from '@/components/organisms/ComponentsGallery/ComponentsGallery';
import AppDataRefreshButton from '@/components/molecules/AppDataRefreshButton/AppDataRefreshButton';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useAppDataCache } from '@/context/AppDataCacheContext';
import styles from './page.module.css';

export default function ComponentsPageClient() {
  const { audience, isLoading: isAuthLoading } = useAuthSession();
  const { components, groupSettings, isHydrating, isRefreshing, error, refreshAppData } = useAppDataCache();
  const categoryTags = Array.isArray(groupSettings?.categoryTags) ? groupSettings.categoryTags : [];

  if (isHydrating) {
    return (
      <section className={styles.statusCard} aria-live="polite">
        <p className={styles.statusText}>Carregando componentes...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.statusCard} aria-live="polite">
        <p className={styles.statusText}>{error}</p>
        <AppDataRefreshButton onClick={refreshAppData} isRefreshing={isRefreshing} label="Atualizar" compact />
      </section>
    );
  }

  return (
    <ComponentsGallery
      components={components}
      categoryTags={categoryTags}
      canEdit={Boolean(!isAuthLoading && audience === 'group-app')}
    />
  );
}
