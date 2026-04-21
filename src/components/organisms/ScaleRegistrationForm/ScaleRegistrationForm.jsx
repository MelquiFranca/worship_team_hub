'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import Calendar from '@/components/molecules/Calendar/Calendar';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useGroupSettings } from '@/context/GroupSettingsContext';
import { GROUP_FUNCTION_OPTIONS } from '@/data/groupFunctions';
import { getApiErrorMessage, readResponsePayload, requestJson } from '@/lib/api/http';
import styles from './ScaleRegistrationForm.module.css';

const SHIFT_OPTIONS = ['Manha', 'Tarde', 'Noite'];

function formatDate(date) {
  if (!date) {
    return 'Nenhuma data selecionada';
  }

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(date);
}

function extractComponentList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.components)) {
    return payload.components;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return null;
}

function normalizeApiComponent(component) {
  if (!component || typeof component !== 'object') {
    return null;
  }

  const id = component.id != null ? String(component.id) : '';
  const name =
    (typeof component.fullName === 'string' && component.fullName.trim()) ||
    (typeof component.name === 'string' && component.name.trim()) ||
    (typeof component.username === 'string' && component.username.trim()) ||
    '';

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    photo: normalizePhotoUrl(
      (typeof component.photo === 'string' && component.photo) ||
        (typeof component.photoDataUrl === 'string' && component.photoDataUrl) ||
        (typeof component.photoUrl === 'string' && component.photoUrl) ||
        ''
    ),
    role:
      (typeof component.role === 'string' && component.role) ||
      (typeof component.function === 'string' && component.function) ||
      (typeof component.primaryFunction === 'string' && component.primaryFunction) ||
      'Componente',
    unavailableDates: Array.isArray(component.unavailableDates)
      ? component.unavailableDates.filter((entry) => typeof entry === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry))
      : []
  };
}

function normalizePhotoUrl(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return '';
  }

  if (trimmedValue.startsWith('data:image/')) {
    return trimmedValue;
  }

  try {
    const parsed = new URL(trimmedValue);

    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmedValue;
    }
  } catch {
    // URL invalida: retorna vazio para fallback textual do avatar.
  }

  return '';
}

function normalizeComponentOptions(payload) {
  const list = extractComponentList(payload);

  if (!list) {
    return null;
  }

  return list
    .map(normalizeApiComponent)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function resolveRequestIdFromHeaders(headers) {
  if (!headers || typeof headers.get !== 'function') {
    return '';
  }

  return (
    headers.get('x-request-id') ||
    headers.get('request-id') ||
    headers.get('x-correlation-id') ||
    ''
  ).trim();
}

function formatScaleDateForPayload(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function componentIsUnavailableOnDate(component, isoDate) {
  if (!isoDate) {
    return false;
  }

  if (!Array.isArray(component?.unavailableDates)) {
    return false;
  }

  return component.unavailableDates.includes(isoDate);
}

function parseScaleDate(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  const trimmedValue = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    const [year, month, day] = trimmedValue.split('-').map((item) => Number(item));
    const parsedDate = new Date(year, month - 1, day);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(trimmedValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function normalizeScalePlaylist(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      const videoId =
        (typeof item?.videoId === 'string' && item.videoId.trim()) ||
        (typeof item?.id === 'string' && item.id.trim()) ||
        '';
      const title =
        (typeof item?.title === 'string' && item.title.trim()) ||
        `Video ${index + 1}`;

      return {
        ...item,
        videoId,
        id: videoId || `playlist-${index}`,
        title,
        channelTitle: typeof item?.channelTitle === 'string' ? item.channelTitle : '',
        url: typeof item?.url === 'string' ? item.url : '',
        videoUrl:
          (typeof item?.videoUrl === 'string' && item.videoUrl) ||
          (typeof item?.url === 'string' && item.url) ||
          '',
        thumbnailUrl: typeof item?.thumbnailUrl === 'string' ? item.thumbnailUrl : ''
      };
    })
    .filter((item) => item.videoId || item.videoUrl || item.url);
}

function normalizePermissionComponentIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set();
  const ids = [];

  value.forEach((entry) => {
    const componentId = typeof entry === 'string' ? entry.trim() : '';

    if (!componentId || seenIds.has(componentId)) {
      return;
    }

    seenIds.add(componentId);
    ids.push(componentId);
  });

  return ids;
}

function normalizeScaleItem(payload) {
  const candidate =
    (payload?.item && typeof payload.item === 'object' && payload.item) ||
    (payload?.data && typeof payload.data === 'object' && payload.data) ||
    (payload?.scale && typeof payload.scale === 'object' && payload.scale) ||
    (payload && typeof payload === 'object' ? payload : null);

  if (!candidate) {
    return null;
  }

  const components = (Array.isArray(candidate.components) ? candidate.components : [])
    .map((item, index) => {
      const componentId =
        (typeof item?.componentId === 'string' && item.componentId.trim()) ||
        (typeof item?.id === 'string' && item.id.trim()) ||
        '';

      if (!componentId) {
        return null;
      }

      return {
        componentId,
        function:
          (typeof item?.function === 'string' && item.function.trim()) ||
          (typeof item?.role === 'string' && item.role.trim()) ||
          '',
        componentName:
          (typeof item?.componentName === 'string' && item.componentName.trim()) ||
          (typeof item?.name === 'string' && item.name.trim()) ||
          (typeof item?.component?.name === 'string' && item.component.name.trim()) ||
          `Componente ${index + 1}`,
        componentPhoto:
          (typeof item?.photo === 'string' && item.photo) ||
          (typeof item?.photoDataUrl === 'string' && item.photoDataUrl) ||
          (typeof item?.photoUrl === 'string' && item.photoUrl) ||
          ''
      };
    })
    .filter(Boolean);

  const permissionSource =
    (candidate.permissions && typeof candidate.permissions === 'object' ? candidate.permissions : null) || candidate;

  return {
    date: typeof candidate.date === 'string' ? candidate.date : '',
    shift: typeof candidate.shift === 'string' ? candidate.shift : '',
    components,
    playlist: normalizeScalePlaylist(candidate.playlist),
    playlistEditorComponentIds: normalizePermissionComponentIds(
      permissionSource.playlistEditorComponentIds || permissionSource.playlistEditors
    ),
    imageEditorComponentIds: normalizePermissionComponentIds(
      permissionSource.imageEditorComponentIds || permissionSource.imageEditors
    )
  };
}

function mergeScaleComponentsIntoOptions(currentOptions, scaleComponents) {
  const byId = new Map(currentOptions.map((component) => [component.id, component]));

  scaleComponents.forEach((item) => {
    if (!byId.has(item.componentId)) {
      byId.set(item.componentId, {
        id: item.componentId,
        name: item.componentName || 'Componente sem nome',
        photo: normalizePhotoUrl(item.componentPhoto || ''),
        role: 'Componente'
      });
    }
  });

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function getVideoId(item) {
  return item.videoId || item.playlistId || item.id?.videoId || item.id;
}

function formatResultKey(item) {
  return getVideoId(item) || `${item.title}-${item.channelTitle}`;
}

function isSupportedYouTubeUrl(rawUrl) {
  try {
    const parsedUrl = new URL(rawUrl);
    const host = parsedUrl.hostname.toLowerCase();

    return host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com');
  } catch {
    return false;
  }
}

export default function ScaleRegistrationForm({ scaleId = '' }) {
  const { permissions, isLoading: isAuthSessionLoading } = useAuthSession();
  const { settings, availableFunctionOptions } = useGroupSettings();
  const normalizedScaleId = typeof scaleId === 'string' ? scaleId.trim() : '';
  const isEditMode = Boolean(normalizedScaleId);
  const isComponentApp = !isAuthSessionLoading && Boolean(permissions.isComponentApp);
  const isEditLocked = isEditMode && isComponentApp;
  const [componentOptions, setComponentOptions] = useState([]);
  const [componentLoadState, setComponentLoadState] = useState('loading');
  const [componentLoadMessage, setComponentLoadMessage] = useState('Carregando componentes do backend...');
  const [componentRetryToken, setComponentRetryToken] = useState(0);
  const [scaleDate, setScaleDate] = useState(null);
  const [scaleDateError, setScaleDateError] = useState('');
  const [shift, setShift] = useState('');
  const [selectedComponentIds, setSelectedComponentIds] = useState([]);
  const [playlistEditorComponentIds, setPlaylistEditorComponentIds] = useState([]);
  const [imageEditorComponentIds, setImageEditorComponentIds] = useState([]);
  const [functionsByComponent, setFunctionsByComponent] = useState({});
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchStatus, setSearchStatus] = useState('idle');
  const [searchMessage, setSearchMessage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [previewItem, setPreviewItem] = useState(null);
  const [previewStatus, setPreviewStatus] = useState('idle');
  const [previewMessage, setPreviewMessage] = useState('');
  const [playlist, setPlaylist] = useState([]);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [missingFunctionIds, setMissingFunctionIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScaleLoading, setIsScaleLoading] = useState(isEditMode);
  const [scaleLoadError, setScaleLoadError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadComponents() {
      setComponentLoadState('loading');
      setComponentLoadMessage('Carregando componentes do backend...');

      try {
        const response = await fetch('/api/components', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'include',
          headers: {
            Accept: 'application/json'
          }
        });
        const payload = await readResponsePayload(response);
        const requestId = resolveRequestIdFromHeaders(response.headers);

        if (!response.ok) {
          const message = getApiErrorMessage(
            payload,
            response.status,
            'Nao foi possivel carregar os componentes do backend.'
          );
          throw new Error(message, {
            cause: {
              status: response.status,
              requestId,
              reason: 'http_error'
            }
          });
        }

        const normalizedComponents = normalizeComponentOptions(payload);

        if (!isActive) {
          return;
        }

        if (!normalizedComponents) {
          throw new Error('Resposta invalida ao carregar componentes.', {
            cause: {
              status: response.status,
              requestId,
              reason: 'invalid_payload'
            }
          });
        }

        if (normalizedComponents.length > 0) {
          setComponentOptions(normalizedComponents);
          setComponentLoadState('ready');
          setComponentLoadMessage('');
          return;
        }

        setComponentOptions([]);
        setComponentLoadState('empty');
        setComponentLoadMessage(
          'Nenhum componente encontrado. Cadastre componentes antes de salvar uma escala.'
        );
      } catch (error) {
        if (!isActive) {
          return;
        }

        const errorStatus =
          error && typeof error === 'object' && typeof error.cause?.status === 'number'
            ? error.cause.status
            : null;
        const errorRequestId =
          error && typeof error === 'object' && typeof error.cause?.requestId === 'string'
            ? error.cause.requestId
            : '';

        console.error(
          JSON.stringify({
            event: 'components_load_failed',
            domain: 'scale_registration',
            route:
              typeof window !== 'undefined' && typeof window.location?.pathname === 'string'
                ? window.location.pathname
                : '/cadastro-escalas',
            status: errorStatus,
            requestId: errorRequestId || null,
            timestamp: new Date().toISOString()
          })
        );

        setComponentOptions([]);
        setComponentLoadState('error');
        setComponentLoadMessage(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel carregar os componentes do backend. Tente novamente.'
        );
      }
    }

    loadComponents();

    return () => {
      isActive = false;
    };
  }, [componentRetryToken]);

  useEffect(() => {
    if (!isEditMode) {
      setIsScaleLoading(false);
      setScaleLoadError('');
      return;
    }

    let isActive = true;

    async function loadScaleById() {
      setIsScaleLoading(true);
      setScaleLoadError('');

      try {
        const payload = await requestJson(`/api/scales/${encodeURIComponent(normalizedScaleId)}`, {
          method: 'GET',
          cache: 'no-store'
        });
        const scaleItem = normalizeScaleItem(payload);

        if (!isActive) {
          return;
        }

        if (!scaleItem) {
          throw new Error('Nao foi possivel carregar os dados da escala para edicao.');
        }

        const dateValue = parseScaleDate(scaleItem.date);
        const selectedIds = scaleItem.components.map((item) => item.componentId);
        const nextFunctions = scaleItem.components.reduce((accumulator, item) => {
          accumulator[item.componentId] = item.function;
          return accumulator;
        }, {});

        setScaleDate(dateValue);
        setShift(scaleItem.shift || '');
        setSelectedComponentIds(selectedIds);
        setPlaylistEditorComponentIds(
          scaleItem.playlistEditorComponentIds.filter((componentId) => selectedIds.includes(componentId))
        );
        setImageEditorComponentIds(
          scaleItem.imageEditorComponentIds.filter((componentId) => selectedIds.includes(componentId))
        );
        setFunctionsByComponent(nextFunctions);
        setMissingFunctionIds([]);
        setPlaylist(scaleItem.playlist);
        setComponentOptions((currentOptions) => mergeScaleComponentsIntoOptions(currentOptions, scaleItem.components));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setScaleLoadError(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel carregar a escala para edicao. Tente novamente.'
        );
      } finally {
        if (isActive) {
          setIsScaleLoading(false);
        }
      }
    }

    loadScaleById();

    return () => {
      isActive = false;
    };
  }, [isEditMode, normalizedScaleId]);

  const selectedComponents = useMemo(
    () => componentOptions.filter((component) => selectedComponentIds.includes(component.id)),
    [componentOptions, selectedComponentIds]
  );
  const hasAvailableComponents = componentOptions.length > 0;
  const isSubmitBlockedByComponents = !hasAvailableComponents || componentLoadState === 'loading';
  const selectedScaleDateIso = useMemo(() => formatScaleDateForPayload(scaleDate), [scaleDate]);
  const unavailableSelectedComponents = useMemo(
    () => selectedComponents.filter((component) => componentIsUnavailableOnDate(component, selectedScaleDateIso)),
    [selectedComponents, selectedScaleDateIso]
  );

  const selectedFunctionsCount = selectedComponents.filter((component) =>
    Boolean(functionsByComponent[component.id]?.trim())
  ).length;
  const functionSelectOptions = useMemo(() => {
    const configuredIds = new Set(settings.availableFunctions);
    const configuredLabels = availableFunctionOptions
      .filter((option) => configuredIds.has(option.id))
      .map((option) => option.label);

    return configuredLabels.length
      ? configuredLabels
      : GROUP_FUNCTION_OPTIONS.map((option) => option.label);
  }, [availableFunctionOptions, settings.availableFunctions]);

  const toggleComponent = (componentId) => {
    if (isEditLocked) {
      return;
    }

    setSelectedComponentIds((currentIds) => {
      const isSelected = currentIds.includes(componentId);
      const nextIds = isSelected
        ? currentIds.filter((id) => id !== componentId)
        : [...currentIds, componentId];

      if (isSelected) {
        setFunctionsByComponent((currentFunctions) => {
          const nextFunctions = { ...currentFunctions };
          delete nextFunctions[componentId];
          return nextFunctions;
        });

        setMissingFunctionIds((currentMissingIds) => currentMissingIds.filter((id) => id !== componentId));
        setPlaylistEditorComponentIds((currentIds) => currentIds.filter((id) => id !== componentId));
        setImageEditorComponentIds((currentIds) => currentIds.filter((id) => id !== componentId));
      }

      return nextIds;
    });
  };

  const togglePermissionComponentId = (componentId, setter) => {
    if (isEditLocked) {
      return;
    }

    setter((currentIds) => {
      if (currentIds.includes(componentId)) {
        return currentIds.filter((id) => id !== componentId);
      }

      if (!selectedComponentIds.includes(componentId)) {
        return currentIds;
      }

      return [...currentIds, componentId];
    });
  };

  const updateFunction = (componentId, value) => {
    if (isEditLocked) {
      return;
    }

    setFunctionsByComponent((currentFunctions) => ({
      ...currentFunctions,
      [componentId]: value
    }));
    setMissingFunctionIds((currentMissingIds) => currentMissingIds.filter((id) => id !== componentId));
  };

  const isPlaylistDuplicate = (videoId) => playlist.some((playlistItem) => getVideoId(playlistItem) === videoId);

  const appendToPlaylist = (item) => {
    const videoId = getVideoId(item);

    if (!videoId) {
      return { added: false, reason: 'missing-video-id' };
    }

    if (isPlaylistDuplicate(videoId)) {
      return { added: false, reason: 'duplicate' };
    }

    setPlaylist((currentPlaylist) => [
      ...currentPlaylist,
      {
        ...item,
        videoId
      }
    ]);

    return { added: true, videoId };
  };

  const searchYouTube = async (event) => {
    event?.preventDefault?.();

    if (isEditLocked) {
      return;
    }

    const term = query.trim();
    if (!term) {
      setSearchStatus('error');
      setSearchMessage('Digite o nome da musica para pesquisar.');
      setSearchResults([]);
      return;
    }

    setSearchStatus('loading');
    setSearchMessage('');

    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(term)}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || 'Nao foi possivel consultar o YouTube agora.');
      }

      setSearchResults(payload.items || []);
      setSearchStatus('success');
      setSearchMessage(payload.items?.length ? '' : 'Nenhum resultado encontrado para essa busca.');
    } catch (error) {
      setSearchResults([]);
      setSearchStatus('error');
      setSearchMessage(error instanceof Error ? error.message : 'Falha na busca do YouTube.');
    }
  };

  const addToPlaylist = (item) => {
    if (isEditLocked) {
      return;
    }

    const result = appendToPlaylist(item);

    if (result.added) {
      setSearchMessage('');
      return;
    }

    if (result.reason === 'duplicate') {
      setSearchMessage('Essa musica ja esta na playlist da escala.');
    }
  };

  const loadPreview = async (event) => {
    event?.preventDefault?.();

    if (isEditLocked) {
      return;
    }

    const trimmedUrl = videoUrl.trim();

    if (!trimmedUrl) {
      setPreviewStatus('error');
      setPreviewMessage('Cole um link valido do YouTube ou YouTube Music antes de validar.');
      setPreviewItem(null);
      return;
    }

    if (!isSupportedYouTubeUrl(trimmedUrl)) {
      setPreviewStatus('error');
      setPreviewMessage('O link precisa ser do YouTube/YouTube Music (video, musica ou playlist).');
      setPreviewItem(null);
      return;
    }

    setPreviewStatus('loading');
    setPreviewMessage('');

    try {
      const response = await fetch(`/api/youtube/preview?url=${encodeURIComponent(trimmedUrl)}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || 'Nao foi possivel carregar o preview do link.');
      }

      setPreviewItem(payload);
      setPreviewStatus('success');
      setPreviewMessage(
        payload.previewSource === 'fallback'
          ? 'Preview carregado com metadados basicos do link.'
          : ''
      );
    } catch (error) {
      setPreviewItem(null);
      setPreviewStatus('error');
      setPreviewMessage(error instanceof Error ? error.message : 'Falha ao carregar o preview do link.');
    }
  };

  const handleVideoUrlChange = (event) => {
    if (isEditLocked) {
      return;
    }

    setVideoUrl(event.target.value);
    if (previewItem || previewStatus !== 'idle' || previewMessage) {
      setPreviewItem(null);
      setPreviewStatus('idle');
      setPreviewMessage('');
    }
  };

  const addPreviewToPlaylist = () => {
    if (isEditLocked) {
      return;
    }

    if (!previewItem) {
      return;
    }

    const result = appendToPlaylist(previewItem);

    if (result.added) {
      setPreviewMessage('Video adicionado na playlist da escala.');
      setPreviewStatus('success');
      return;
    }

    if (result.reason === 'duplicate') {
      setPreviewMessage('Esse video ja esta na playlist da escala.');
      setPreviewStatus('error');
      return;
    }

    setPreviewMessage('Nao foi possivel adicionar esse video.');
    setPreviewStatus('error');
  };

  const removeFromPlaylist = (videoId) => {
    if (isEditLocked) {
      return;
    }

    setPlaylist((currentPlaylist) => currentPlaylist.filter((item) => getVideoId(item) !== videoId));
  };

  useEffect(() => {
    const allowedIds = new Set(componentOptions.map((component) => component.id));

    setSelectedComponentIds((currentIds) => currentIds.filter((id) => allowedIds.has(id)));
    setPlaylistEditorComponentIds((currentIds) => currentIds.filter((id) => allowedIds.has(id)));
    setImageEditorComponentIds((currentIds) => currentIds.filter((id) => allowedIds.has(id)));
    setFunctionsByComponent((currentFunctions) => {
      const nextFunctions = {};

      Object.entries(currentFunctions).forEach(([componentId, value]) => {
        if (allowedIds.has(componentId)) {
          nextFunctions[componentId] = value;
        }
      });

      return nextFunctions;
    });
    setMissingFunctionIds((currentMissingIds) => currentMissingIds.filter((id) => allowedIds.has(id)));
  }, [componentOptions]);

  const handleSubmit = async () => {
    if (isEditLocked) {
      setSubmitError('Seu perfil de componente nao tem permissao para editar esta escala.');
      setSubmitMessage('');
      return;
    }

    if (isSubmitBlockedByComponents) {
      setSubmitError(
        componentLoadState === 'loading'
          ? 'Aguarde o carregamento dos componentes antes de salvar a escala.'
          : 'Nao existem componentes validos para montar a escala.'
      );
      setSubmitMessage('');
      return;
    }

    const validationErrors = [];

    if (!scaleDate) {
      validationErrors.push('Selecione a data da escala.');
      setScaleDateError('Selecione a data da escala.');
    } else if (scaleDateError) {
      setScaleDateError('');
    }

    if (!shift) {
      validationErrors.push('Selecione o turno da escala.');
    }

    if (!selectedComponents.length) {
      validationErrors.push('Selecione ao menos um componente.');
    }

    const missingFunctions = selectedComponents.filter((component) => !functionsByComponent[component.id]?.trim());
    if (missingFunctions.length) {
      validationErrors.push('Selecione a funcao de cada componente selecionado.');
      setMissingFunctionIds(missingFunctions.map((component) => component.id));
    } else {
      setMissingFunctionIds([]);
    }

    if (validationErrors.length) {
      setSubmitError(validationErrors.join(' '));
      setSubmitMessage('');
      return;
    }

    if (unavailableSelectedComponents.length > 0) {
      const componentNames = unavailableSelectedComponents.map((component) => component.name).join(', ');
      setSubmitError(
        `Os componentes ${componentNames} estao indisponiveis na data escolhida. Remova-os para continuar.`
      );
      setSubmitMessage('');
      return;
    }

    const payload = {
      date: formatScaleDateForPayload(scaleDate),
      shift,
      components: selectedComponents.map((component) => ({
        componentId: component.id,
        function: functionsByComponent[component.id].trim()
      })),
      playlistEditorComponentIds,
      imageEditorComponentIds,
      playlist: playlist.map((item) => ({
        videoId: getVideoId(item) || '',
        title: item.title || '',
        channelTitle: item.channelTitle || '',
        url: item.url || item.videoUrl || '',
        videoUrl: item.videoUrl || item.url || '',
        thumbnailUrl: item.thumbnailUrl || ''
      }))
    };

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const responsePayload = await requestJson(
        isEditMode ? `/api/scales/${encodeURIComponent(normalizedScaleId)}` : '/api/scales',
        {
          method: isEditMode ? 'PATCH' : 'POST',
          body: payload
        }
      );

      const successMessage =
        typeof responsePayload?.message === 'string' && responsePayload.message.trim()
          ? responsePayload.message.trim()
          : isEditMode
            ? `Escala atualizada com sucesso para ${formatDate(scaleDate)}.`
            : `Escala cadastrada com sucesso em ${formatDate(scaleDate)}.`;

      setSubmitMessage(successMessage);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : isEditMode
            ? 'Nao foi possivel atualizar a escala agora. Tente novamente.'
            : 'Nao foi possivel cadastrar a escala agora. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) {
      return;
    }

    if (isEditLocked) {
      setSubmitError('Seu perfil de componente nao tem permissao para excluir esta escala.');
      setSubmitMessage('');
      return;
    }

    if (!window.confirm('Tem certeza que deseja excluir esta escala? Esta acao nao pode ser desfeita.')) {
      return;
    }

    setIsDeleting(true);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const responsePayload = await requestJson(`/api/scales/${encodeURIComponent(normalizedScaleId)}`, {
        method: 'DELETE'
      });

      const successMessage =
        typeof responsePayload?.message === 'string' && responsePayload.message.trim()
          ? responsePayload.message.trim()
          : 'Escala excluida com sucesso.';

      setSubmitMessage(successMessage);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Nao foi possivel excluir a escala agora. Tente novamente.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const formAriaLabel = isEditMode ? 'Edicao de escalas' : 'Cadastro de escalas';
  const heroKicker = isEditMode ? 'Edicao de escalas' : 'Cadastro de escalas';
  const heroTitle = isEditMode
    ? 'Atualize a escala, revise funcoes e ajuste a playlist em um so fluxo.'
    : 'Monte a escala, atribua funcoes e feche a playlist em um so fluxo.';
  const heroDescription = isEditMode
    ? 'Revise os dados carregados da escala selecionada e aplique os ajustes necessarios antes de salvar.'
    : 'A tela segue a identidade visual das escalas do projeto, com cards limpos, gradientes quentes e foco na leitura rapida do que ja foi selecionado.';
  const showComponentStatusNotice = componentLoadState !== 'ready' || Boolean(componentLoadMessage);
  const canRetryComponentLoad = componentLoadState === 'error';

  return (
    <section className={styles.page} aria-label={formAriaLabel}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>{heroKicker}</p>
          <h1>{heroTitle}</h1>
          <p className={styles.description}>{heroDescription}</p>
        </div>

        <div className={styles.heroStats} aria-label="Resumo da escala">
          <article>
            <span>Data</span>
            <strong>{formatDate(scaleDate)}</strong>
          </article>
          <article>
            <span>Turno</span>
            <strong>{shift || 'Nao definido'}</strong>
          </article>
          <article>
            <span>Playlist</span>
            <strong>
              {playlist.length} musica{playlist.length === 1 ? '' : 's'}
            </strong>
          </article>
        </div>
      </header>

      {submitMessage ? (
        <p className={styles.successMessage} role="status" aria-live="polite">
          {submitMessage}
        </p>
      ) : null}

      {submitError ? (
        <p className={styles.errorMessage} role="alert">
          {submitError}
        </p>
      ) : null}

      {scaleLoadError ? (
        <p className={styles.errorMessage} role="alert">
          {scaleLoadError}
        </p>
      ) : null}

      {isScaleLoading ? (
        <p className={styles.loadingMessage} role="status" aria-live="polite">
          Carregando dados da escala para edicao...
        </p>
      ) : null}

      {isEditLocked ? (
        <p className={styles.permissionMessage} role="status" aria-live="polite">
          Seu perfil de componente pode visualizar esta escala, mas edicao e exclusao estao bloqueadas.
        </p>
      ) : null}

      <div className={styles.formGrid} role="form" aria-label={formAriaLabel}>
        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Data e turno</h2>
              <p>Defina quando a escala vai acontecer.</p>
            </div>

            <div className={styles.scheduleGrid}>
              <Calendar
                id="scaleDate"
                label="Data da escala"
                placeholder="Escolha a data (dia, mes e ano)"
                value={scaleDate}
                onChange={(nextDate) => {
                  setScaleDate(nextDate);
                  if (scaleDateError) {
                    setScaleDateError('');
                  }
                }}
                disabled={isEditLocked}
                required
                error={scaleDateError}
                helperText="Selecione dia, mes e ano. No topo do calendario, ajuste a navegacao para chegar ao ano desejado."
                name="scaleDate"
              />

              <div className={styles.shiftField}>
                <span className={styles.fieldLabel}>Turno</span>
                <div className={styles.shiftGroup} role="radiogroup" aria-label="Turno da escala">
                  {SHIFT_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`${styles.shiftButton} ${shift === option ? styles.shiftButtonActive : ''}`}
                      onClick={() => setShift(option)}
                      disabled={isEditLocked}
                      aria-pressed={shift === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Componentes da escala</h2>
              <p>Selecione os componentes e atribua uma funcao para cada um.</p>
            </div>

            {showComponentStatusNotice ? (
              <div
                className={`${styles.componentStatus} ${
                  componentLoadState === 'error' ? styles.componentStatusError : ''
                }`}
                role={componentLoadState === 'error' ? 'alert' : 'status'}
                aria-live="polite"
              >
                <p className={styles.inlineMessage}>{componentLoadMessage}</p>
                {canRetryComponentLoad ? (
                  <button
                    type="button"
                    className={styles.retryButton}
                    onClick={() => setComponentRetryToken((current) => current + 1)}
                  >
                    Tentar novamente
                  </button>
                ) : null}
              </div>
            ) : null}

            {selectedScaleDateIso && unavailableSelectedComponents.length > 0 ? (
              <p className={styles.unavailabilityMessage} role="alert">
                Existem componentes selecionados indisponiveis em {selectedScaleDateIso}: {' '}
                {unavailableSelectedComponents.map((component) => component.name).join(', ')}.
              </p>
            ) : null}

            <div className={styles.componentGrid}>
              {componentOptions.map((component) => {
                const isSelected = selectedComponentIds.includes(component.id);
                const isUnavailableForDate = componentIsUnavailableOnDate(component, selectedScaleDateIso);
                const isSelectionBlocked = isUnavailableForDate && !isSelected;

                return (
                  <article
                    key={component.id}
                    className={`${styles.componentCard} ${isSelected ? styles.componentCardSelected : ''} ${
                      isSelectionBlocked ? styles.componentCardUnavailable : ''
                    }`}
                  >
                    <button
                      type="button"
                      className={styles.componentToggle}
                      onClick={() => toggleComponent(component.id)}
                      disabled={isEditLocked || isSelectionBlocked || componentLoadState === 'loading'}
                      aria-pressed={isSelected}
                    >
                      <span className={styles.componentAvatar} aria-hidden="true">
                        {component.photo ? (
                          <Image
                            src={component.photo}
                            alt=""
                            width={56}
                            height={56}
                            className={styles.componentImage}
                          />
                        ) : (
                          component.name.slice(0, 1)
                        )}
                      </span>

                      <span className={styles.componentCopy}>
                        <strong>{component.name}</strong>
                        <span>{component.role || 'Componente'}</span>
                      </span>

                      <span className={styles.selectionMark} aria-hidden="true">
                        {isUnavailableForDate && !isSelected
                          ? 'Indisponivel'
                          : isSelected
                            ? 'Selecionado'
                            : 'Selecionar'}
                      </span>
                    </button>

                    {isUnavailableForDate ? (
                      <p className={styles.unavailabilityHint}>
                        Indisponivel na data selecionada.
                      </p>
                    ) : null}

                    {isSelected ? (
                      <label
                        className={`${styles.functionField} ${
                          missingFunctionIds.includes(component.id) ? styles.functionFieldError : ''
                        }`}
                      >
                        <span className={styles.fieldLabel}>Funcao na escala</span>
                        <select
                          className={styles.textInput}
                          value={functionsByComponent[component.id] || ''}
                          onChange={(event) => updateFunction(component.id, event.target.value)}
                          disabled={isEditLocked}
                        >
                          <option value="">Selecione uma funcao</option>
                          {functionSelectOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    {isSelected ? (
                      <div className={styles.permissionFieldset}>
                        <span className={styles.permissionLabel}>Permissoes extras</span>
                        <label className={styles.permissionToggle}>
                          <input
                            type="checkbox"
                            checked={playlistEditorComponentIds.includes(component.id)}
                            onChange={() => togglePermissionComponentId(component.id, setPlaylistEditorComponentIds)}
                            disabled={isEditLocked}
                          />
                          <span>Editar playlist</span>
                        </label>
                        <label className={styles.permissionToggle}>
                          <input
                            type="checkbox"
                            checked={imageEditorComponentIds.includes(component.id)}
                            onChange={() => togglePermissionComponentId(component.id, setImageEditorComponentIds)}
                            disabled={isEditLocked}
                          />
                          <span>Editar imagem</span>
                        </label>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <div className={styles.selectionSummary}>
              <span>{selectedComponents.length} componente(s) selecionado(s)</span>
              <span>{selectedFunctionsCount} funcao(oes) selecionada(s)</span>
              <span>{playlistEditorComponentIds.length} com acesso a playlist</span>
              <span>{imageEditorComponentIds.length} com acesso a imagem</span>
            </div>
          </section>
        </div>

        <aside className={styles.sideColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Busca de musicas</h2>
              <p>Pesquise no YouTube e adicione os resultados na playlist da escala.</p>
            </div>

            <div className={styles.searchForm}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Pesquisar no YouTube</span>
                <input
                  className={styles.searchInput}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  disabled={isEditLocked}
                  placeholder="Pesquisar musica, ministerio ou louvor"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      searchYouTube(event);
                    }
                  }}
                />
              </label>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={searchYouTube}
                disabled={searchStatus === 'loading' || isEditLocked}
              >
                {searchStatus === 'loading' ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {searchMessage ? (
              <p className={styles.inlineMessage} role="status" aria-live="polite">
                {searchMessage}
              </p>
            ) : null}

            <div className={styles.searchResults}>
              {searchResults.length ? (
                searchResults.map((item) => {
                  const videoId = getVideoId(item);
                  const key = formatResultKey(item);
                  const isAdded = playlist.some((playlistItem) => getVideoId(playlistItem) === videoId);

                  return (
                    <article key={key} className={styles.resultCard}>
                      {item.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className={styles.resultThumbnail}
                          src={item.thumbnailUrl}
                          alt={`Miniatura de ${item.title}`}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.resultThumbnailFallback} aria-hidden="true">
                          {item.title.slice(0, 1)}
                        </div>
                      )}
                      <div className={styles.resultCopy}>
                        <strong>{item.title}</strong>
                        <span>{item.channelTitle}</span>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => addToPlaylist(item)}
                          disabled={isAdded || isEditLocked}
                        >
                          {isAdded ? 'Adicionado' : 'Adicionar na playlist'}
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className={styles.emptyState}>
                  {searchStatus === 'idle'
                    ? 'Pesquise para ver pre-visualizacoes de musicas.'
                    : 'Nenhum resultado para exibir.'}
                </p>
              )}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Adicionar por link</h2>
              <p>Cole um link do YouTube/YouTube Music (musica, video ou playlist), carregue o preview e adicione.</p>
            </div>

            <div className={styles.searchForm}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>URL do link</span>
                <input
                  className={styles.searchInput}
                  type="url"
                  value={videoUrl}
                  onChange={handleVideoUrlChange}
                  disabled={isEditLocked}
                  placeholder="https://music.youtube.com/watch?v=... ou .../playlist?list=..."
                  inputMode="url"
                  autoComplete="off"
                />
              </label>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={loadPreview}
                disabled={previewStatus === 'loading' || isEditLocked}
              >
                {previewStatus === 'loading' ? 'Carregando preview...' : 'Validar e carregar preview'}
              </button>
            </div>

            {previewMessage ? (
              <p className={styles.inlineMessage} role={previewStatus === 'error' ? 'alert' : 'status'} aria-live="polite">
                {previewMessage}
              </p>
            ) : null}

            {previewItem ? (
              <article className={styles.previewCard}>
                {previewItem.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.previewThumbnail}
                    src={previewItem.thumbnailUrl}
                    alt={`Miniatura de ${previewItem.title}`}
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.previewThumbnailFallback} aria-hidden="true">
                    {previewItem.title.slice(0, 1)}
                  </div>
                )}

                <div className={styles.previewCopy}>
                  <span className={styles.previewBadge}>
                    {previewItem.previewSource === 'fallback'
                      ? 'Preview basico'
                      : previewItem.entityType === 'playlist'
                        ? 'Preview de playlist'
                        : 'Preview confirmado'}
                  </span>
                  <strong>{previewItem.title}</strong>
                  <span>{previewItem.channelTitle}</span>
                  <a className={styles.previewUrl} href={previewItem.url} target="_blank" rel="noreferrer noopener">
                    {previewItem.entityType === 'playlist' ? 'Abrir playlist no YouTube' : 'Abrir no YouTube'}
                  </a>
                </div>

                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={addPreviewToPlaylist}
                  disabled={isEditLocked}
                >
                  Adicionar na playlist
                </button>
              </article>
            ) : (
              <p className={styles.emptyState}>Nenhum preview carregado ainda.</p>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Playlist da escala</h2>
              <p>Evite duplicatas e acompanhe a ordem do repertorio.</p>
            </div>

            {playlist.length ? (
              <div className={styles.playlistList}>
                {playlist.map((item, index) => {
                  const videoId = getVideoId(item);

                  return (
                    <article key={videoId} className={styles.playlistItem}>
                      <span className={styles.playlistIndex}>{index + 1}</span>
                      <div className={styles.playlistCopy}>
                        <strong>{item.title}</strong>
                        <span>{item.channelTitle}</span>
                      </div>
                      <button
                        type="button"
                        className={styles.playlistRemove}
                        onClick={() => removeFromPlaylist(videoId)}
                        disabled={isEditLocked}
                      >
                        Remover
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyState}>Nenhuma musica adicionada ainda.</p>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Resumo final</h2>
              <p>Confira os campos obrigatorios antes de concluir.</p>
            </div>

            <div className={styles.summaryList}>
              <div>
                <span className={styles.fieldLabel}>Data</span>
                <strong>{scaleDate ? formatDate(scaleDate) : 'Pendente'}</strong>
              </div>
              <div>
                <span className={styles.fieldLabel}>Turno</span>
                <strong>{shift || 'Pendente'}</strong>
              </div>
              <div>
                <span className={styles.fieldLabel}>Componentes</span>
                <strong>{selectedComponents.length}</strong>
              </div>
              <div>
                <span className={styles.fieldLabel}>Playlist</span>
                <strong>{playlist.length}</strong>
              </div>
            </div>

            <div className={styles.actionRow}>
              {isEditMode ? (
                <button
                  className={styles.deleteButton}
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting || isSubmitting || isEditLocked || isScaleLoading}
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir escala'}
                </button>
              ) : null}
              <button
                className={styles.primaryButton}
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || isDeleting || isEditLocked || isScaleLoading || isSubmitBlockedByComponents}
              >
                {isSubmitting ? 'Salvando...' : isEditMode ? 'Salvar alteracoes' : 'Salvar escala'}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
