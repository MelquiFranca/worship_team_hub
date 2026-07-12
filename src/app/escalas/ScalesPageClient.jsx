'use client';

import { useMemo, useState } from 'react';
import ScaleFeed from '@/components/organisms/ScaleFeed/ScaleFeed';
import { useAppDataCache } from '@/context/AppDataCacheContext';
import { useAuthSession } from '@/context/AuthSessionContext';

const SCALE_TIME_SCOPE_CURRENT_AND_FUTURE = 'current-and-future';
const SCALE_TIME_SCOPE_ALL = 'all';

export default function ScalesPageClient() {
  const { getScalesByTimeScope, scaleImages, groupSettings, components, isHydrating, error } = useAppDataCache();
  const { user: authUser, permissions } = useAuthSession();
  const [timeScope, setTimeScope] = useState(SCALE_TIME_SCOPE_CURRENT_AND_FUTURE);
  const scales = getScalesByTimeScope(timeScope);
  const imageLibrary = scaleImages;
  const categoryTags = Array.isArray(groupSettings?.categoryTags) ? groupSettings.categoryTags : [];
  const sessionCategoryTagIds = useMemo(() => {
    if (!permissions.isComponentApp) {
      return [];
    }

    const authUserId = typeof authUser?.id === 'string' ? authUser.id.trim() : '';
    const currentComponent = Array.isArray(components)
      ? components.find((component) => component?.id === authUserId)
      : null;

    if (!currentComponent || !Array.isArray(currentComponent.categoryTagIds)) {
      return [];
    }

    return Array.from(
      new Set(currentComponent.categoryTagIds.filter((entry) => typeof entry === 'string' && entry.trim()))
    );
  }, [authUser?.id, components, permissions.isComponentApp]);

  return (
    <ScaleFeed
      scales={scales}
      imageLibrary={imageLibrary}
      categoryTags={categoryTags}
      sessionCategoryTagIds={sessionCategoryTagIds}
      timeScope={timeScope}
      onChangeTimeScope={setTimeScope}
      isHydrating={isHydrating}
      error={error}
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
