'use client';

import { useState } from 'react';
import ScaleFeed from '@/components/organisms/ScaleFeed/ScaleFeed';
import AppDataRefreshButton from '@/components/molecules/AppDataRefreshButton/AppDataRefreshButton';
import { useAppDataCache } from '@/context/AppDataCacheContext';
import styles from './page.module.css';

const SCALE_TIME_SCOPE_CURRENT_AND_FUTURE = 'current-and-future';
const SCALE_TIME_SCOPE_ALL = 'all';

export default function ScalesPageClient() {
  const { getScalesByTimeScope, scaleImages, groupSettings, isHydrating, isRefreshing, error, refreshAppData } = useAppDataCache();
  const [timeScope, setTimeScope] = useState(SCALE_TIME_SCOPE_CURRENT_AND_FUTURE);
  const scales = getScalesByTimeScope(timeScope);
  const imageLibrary = scaleImages;
  const categoryTags = Array.isArray(groupSettings?.categoryTags) ? groupSettings.categoryTags : [];
  const sessionCategoryTagIds = [];

  if (isHydrating) {
    return (
      <section className={styles.statusCard} aria-live="polite">
        <p className={styles.statusText}>Carregando escalas...</p>
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
    <ScaleFeed
      scales={scales}
      imageLibrary={imageLibrary}
      categoryTags={categoryTags}
      sessionCategoryTagIds={sessionCategoryTagIds}
      timeScope={timeScope}
      onChangeTimeScope={setTimeScope}
      timeScopeOptions={[
        {
          value: SCALE_TIME_SCOPE_CURRENT_AND_FUTURE,
          label: 'Hoje e futuras'
        },
        {
          value: SCALE_TIME_SCOPE_ALL,
          label: 'Todas'
        }
      ]}
    />
  );
}
