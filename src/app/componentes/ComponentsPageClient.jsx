'use client';

import { useCallback, useEffect, useState } from 'react';
import ComponentsGallery from '@/components/organisms/ComponentsGallery/ComponentsGallery';
import { useAuthSession } from '@/context/AuthSessionContext';
import { requestJson } from '@/lib/api/http';
import styles from './page.module.css';

function normalizeComponent(item, index) {
  const id =
    (typeof item?.id === 'string' && item.id.trim()) ||
    (typeof item?._id === 'string' && item._id.trim()) ||
    `component-${index}`;
  const name =
    (typeof item?.fullName === 'string' && item.fullName.trim()) ||
    (typeof item?.name === 'string' && item.name.trim()) ||
    (typeof item?.displayName === 'string' && item.displayName.trim()) ||
    'Componente sem nome';
  const photo =
    (typeof item?.photoDataUrl === 'string' && item.photoDataUrl.trim()) ||
    (typeof item?.photoUrl === 'string' && item.photoUrl.trim()) ||
    (typeof item?.photo === 'string' && item.photo.trim()) ||
    '';
  const isActive = typeof item?.isActive === 'boolean' ? item.isActive : true;
  const categoryTagIds = Array.isArray(item?.categoryTagIds)
    ? item.categoryTagIds.filter((entry) => typeof entry === 'string' && entry.trim())
    : [];

  return { id, name, photo, isActive, categoryTagIds };
}

export default function ComponentsPageClient() {
  const { audience, isLoading: isAuthLoading } = useAuthSession();
  const [components, setComponents] = useState([]);
  const [categoryTags, setCategoryTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchComponents = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [payload, groupSettingsPayload] = await Promise.all([
        requestJson('/api/components?limit=100'),
        requestJson('/api/group-settings')
      ]);
      const items = Array.isArray(payload?.items) ? payload.items : [];
      const normalized = items
        .map((item, index) => normalizeComponent(item, index))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setComponents(normalized);
      setCategoryTags(
        Array.isArray(groupSettingsPayload?.item?.categoryTags)
          ? groupSettingsPayload.item.categoryTags
          : []
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Nao foi possivel carregar os componentes.'
      );
      setComponents([]);
      setCategoryTags([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  if (isLoading) {
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
        <button type="button" className={styles.retryButton} onClick={fetchComponents}>
          Tentar novamente
        </button>
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
