'use client';

import { useCallback, useEffect, useState } from 'react';
import ScaleFeed from '@/components/organisms/ScaleFeed/ScaleFeed';
import { requestJson } from '@/lib/api/http';
import styles from './page.module.css';

const SCALE_TIME_SCOPE_CURRENT_AND_FUTURE = 'current-and-future';
const SCALE_TIME_SCOPE_ALL = 'all';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatScaleDate(value) {
  const dateValue = normalizeString(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue || 'Data nao informada';
  }

  const [year, month, day] = dateValue.split('-');
  return `${day}/${month}/${year}`;
}

function normalizeComponentCatalog(items) {
  const map = new Map();

  (Array.isArray(items) ? items : []).forEach((item, index) => {
    const id =
      normalizeString(item?.id) ||
      normalizeString(item?._id) ||
      `component-${index}`;
    const name =
      normalizeString(item?.fullName) ||
      normalizeString(item?.name) ||
      normalizeString(item?.displayName) ||
      'Componente sem nome';
    const photo =
      normalizeString(item?.photoDataUrl) ||
      normalizeString(item?.photoUrl) ||
      normalizeString(item?.photo) ||
      `https://i.pravatar.cc/120?u=${encodeURIComponent(id)}`;

    map.set(id, { id, name, photo });
  });

  return map;
}

function normalizePlaylist(playlist) {
  if (!Array.isArray(playlist)) {
    return [];
  }

  return playlist.map((item, index) => ({
    id: normalizeString(item?.id) || `playlist-${index}`,
    title: normalizeString(item?.title) || `Video ${index + 1}`,
    videoUrl: normalizeString(item?.videoUrl) || normalizeString(item?.url)
  }));
}

function normalizePermissionComponentIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set();
  const items = [];

  value.forEach((entry) => {
    const componentId = normalizeString(entry);

    if (!componentId || seenIds.has(componentId)) {
      return;
    }

    seenIds.add(componentId);
    items.push(componentId);
  });

  return items;
}

function normalizeImageAttachment(value, { fallbackSourceScaleId = '', fallbackSourceScaleLabel = '' } = {}) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const src = normalizeString(value?.src);

  if (!src) {
    return null;
  }

  const fallbackIdSeed = [value?.sourceScaleId, src]
    .map((entry) => normalizeString(entry))
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

  return {
    id: normalizeString(value?.id) || (fallbackIdSeed ? `scale-image-${fallbackIdSeed}` : 'scale-image'),
    src,
    alt: normalizeString(value?.alt) || 'Imagem da escala',
    label: normalizeString(value?.label) || 'Imagem da escala',
    sourceScaleId: normalizeString(value?.sourceScaleId) || fallbackSourceScaleId,
    sourceScaleLabel: normalizeString(value?.sourceScaleLabel) || fallbackSourceScaleLabel
  };
}

function normalizeScales(scaleItems, componentsById) {
  if (!Array.isArray(scaleItems)) {
    return [];
  }

  return scaleItems.map((scale, index) => {
    const scaleId =
      normalizeString(scale?.id) ||
      normalizeString(scale?._id) ||
      `scale-${index}`;
    const scaleComponents = Array.isArray(scale?.components) ? scale.components : [];

    const members = scaleComponents.map((item, memberIndex) => {
      const componentId = normalizeString(item?.componentId) || `component-${memberIndex}`;
      const componentData = componentsById.get(componentId);
      const role = normalizeString(item?.function) || 'Sem funcao definida';
      const normalizedRole = role.toLowerCase();
      const isLeader = normalizedRole.includes('lider');

      return {
        id: componentId,
        name: componentData?.name || 'Componente nao encontrado',
        role,
        photo:
          componentData?.photo ||
          `https://i.pravatar.cc/120?u=${encodeURIComponent(componentId)}`,
        isLeader
      };
    });

    const formattedDate = formatScaleDate(scale?.date);
    const shift = normalizeString(scale?.shift) || 'Turno nao informado';
    const imageAttachment = normalizeImageAttachment(scale?.imageAttachment, {
      fallbackSourceScaleId: scaleId,
      fallbackSourceScaleLabel: `${formattedDate} - ${shift}`
    });

    return {
      id: scaleId,
      date: formattedDate,
      shift,
      canEdit: scale?.canEdit !== false,
      members,
      playlist: normalizePlaylist(scale?.playlist),
      playlistEditorComponentIds: normalizePermissionComponentIds(scale?.playlistEditorComponentIds),
      imageEditorComponentIds: normalizePermissionComponentIds(scale?.imageEditorComponentIds),
      messages: Array.isArray(scale?.messages) ? scale.messages : [],
      imageAttachment
    };
  });
}

export default function ScalesPageClient() {
  const [scales, setScales] = useState([]);
  const [imageLibrary, setImageLibrary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeScope, setTimeScope] = useState(SCALE_TIME_SCOPE_CURRENT_AND_FUTURE);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [componentsPayload, scalesPayload, scaleImagesPayload] = await Promise.all([
        requestJson('/api/components?limit=100'),
        requestJson(`/api/scales?limit=100&timeScope=${encodeURIComponent(timeScope)}`),
        requestJson('/api/scales/images')
      ]);

      const componentsById = normalizeComponentCatalog(componentsPayload?.items);
      const normalizedScales = normalizeScales(scalesPayload?.items, componentsById);
      const normalizedImageLibrary = (Array.isArray(scaleImagesPayload?.items) ? scaleImagesPayload.items : [])
        .map((image, index) =>
          normalizeImageAttachment(image, {
            fallbackSourceScaleId: `source-${index}`,
            fallbackSourceScaleLabel: 'Imagem reutilizavel'
          })
        )
        .filter(Boolean);
      setScales(normalizedScales);
      setImageLibrary(normalizedImageLibrary);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Nao foi possivel carregar as escalas.'
      );
      setScales([]);
      setImageLibrary([]);
    } finally {
      setIsLoading(false);
    }
  }, [timeScope]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
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
        <button type="button" className={styles.retryButton} onClick={fetchData}>
          Tentar novamente
        </button>
      </section>
    );
  }

  return (
    <ScaleFeed
      scales={scales}
      imageLibrary={imageLibrary}
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
