'use client';

import ComponentsGallery from '@/components/organisms/ComponentsGallery/ComponentsGallery';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useAppDataCache } from '@/context/AppDataCacheContext';
import styles from './page.module.css';

export default function ComponentsPageClient() {
  const { audience, isLoading: isAuthLoading } = useAuthSession();
  const { components, groupSettings, isHydrating, error } = useAppDataCache();
  const categoryTags = Array.isArray(groupSettings?.categoryTags) ? groupSettings.categoryTags : [];
  const activeComponentsCount = components.filter((member) => member.isActive !== false).length;
  const inactiveComponentsCount = components.length - activeComponentsCount;

  return (
    <div className={styles.pageContent}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderCopy}>
          <p className={styles.pageHeaderKicker}>Componentes</p>
          <h1 className={styles.pageHeaderTitle}>Base de componentes</h1>
          <p className={styles.pageHeaderDescription}>
            Visualize todos os componentes em blocos com foto e nome.
          </p>
        </div>

        <div className={styles.pageHeaderSidebar}>
          <div className={styles.pageHeaderStats} aria-label="Resumo dos componentes">
            <article>
              <span>Contexto</span>
              <strong>
                {components.length} componente{components.length === 1 ? '' : 's'}
              </strong>
            </article>
            <article>
              <span>Status</span>
              <strong>{activeComponentsCount} ativos</strong>
            </article>
            <article>
              <span>Detalhe</span>
              <strong>{inactiveComponentsCount} inativos</strong>
            </article>
          </div>
        </div>
      </header>

      {isHydrating ? (
        <section className={styles.statusCard} aria-live="polite">
          <p className={styles.statusText}>Carregando componentes...</p>
        </section>
      ) : error ? (
        <section className={styles.statusCard} aria-live="polite">
          <p className={styles.statusText}>{error}</p>
        </section>
      ) : (
        <ComponentsGallery
          components={components}
          categoryTags={categoryTags}
          canEdit={Boolean(!isAuthLoading && audience === 'group-app')}
        />
      )}
    </div>
  );
}
