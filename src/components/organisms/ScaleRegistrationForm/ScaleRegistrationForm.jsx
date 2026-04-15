'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import Calendar from '@/components/molecules/Calendar/Calendar';
import { useGroupSettings } from '@/context/GroupSettingsContext';
import { GROUP_FUNCTION_OPTIONS } from '@/data/groupFunctions';
import { scales as existingScales } from '@/data/scales';
import { requestJson } from '@/lib/api/http';
import styles from './ScaleRegistrationForm.module.css';

const SHIFT_OPTIONS = ['Manha', 'Tarde', 'Noite'];

function formatDate(date) {
  if (!date) {
    return 'Nenhuma data selecionada';
  }

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(date);
}

function normalizeComponentPool(scales) {
  const pool = new Map();

  scales.forEach((scale) => {
    scale.members.forEach((member) => {
      if (!member.isLeader && !pool.has(member.id)) {
        pool.set(member.id, member);
      }
    });
  });

  return Array.from(pool.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
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

  return [];
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
    photo:
      (typeof component.photo === 'string' && component.photo) ||
      (typeof component.photoUrl === 'string' && component.photoUrl) ||
      '',
    role:
      (typeof component.role === 'string' && component.role) ||
      (typeof component.function === 'string' && component.function) ||
      (typeof component.primaryFunction === 'string' && component.primaryFunction) ||
      'Componente'
  };
}

function normalizeComponentOptions(payload) {
  return extractComponentList(payload)
    .map(normalizeApiComponent)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
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

function getVideoId(item) {
  return item.videoId || item.id?.videoId || item.id;
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

export default function ScaleRegistrationForm() {
  const { settings, availableFunctionOptions } = useGroupSettings();
  const fallbackComponentOptions = useMemo(() => normalizeComponentPool(existingScales), []);
  const [componentOptions, setComponentOptions] = useState(fallbackComponentOptions);
  const [scaleDate, setScaleDate] = useState(null);
  const [shift, setShift] = useState('');
  const [selectedComponentIds, setSelectedComponentIds] = useState([]);
  const [functionsByComponent, setFunctionsByComponent] = useState({});
  const [componentNotice, setComponentNotice] = useState({
    type: 'status',
    message: 'Carregando componentes do backend...'
  });
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

  useEffect(() => {
    let isActive = true;

    async function loadComponents() {
      try {
        const payload = await requestJson('/api/components', {
          method: 'GET',
          cache: 'no-store'
        });

        const normalizedComponents = normalizeComponentOptions(payload);

        if (!isActive) {
          return;
        }

        if (normalizedComponents.length > 0) {
          setComponentOptions(normalizedComponents);
          setComponentNotice({ type: 'idle', message: '' });
          return;
        }

        setComponentOptions(fallbackComponentOptions);
        setComponentNotice({
          type: 'status',
          message: 'A API ainda nao retornou componentes. Mostrando a base local por enquanto.'
        });
      } catch {
        if (!isActive) {
          return;
        }

        setComponentOptions(fallbackComponentOptions);
        setComponentNotice({
          type: 'status',
          message: 'Nao foi possivel carregar os componentes do backend agora. Mostrando a base local.'
        });
      }
    }

    loadComponents();

    return () => {
      isActive = false;
    };
  }, [fallbackComponentOptions]);

  const selectedComponents = useMemo(
    () => componentOptions.filter((component) => selectedComponentIds.includes(component.id)),
    [componentOptions, selectedComponentIds]
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
      }

      return nextIds;
    });
  };

  const updateFunction = (componentId, value) => {
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

    const trimmedUrl = videoUrl.trim();

    if (!trimmedUrl) {
      setPreviewStatus('error');
      setPreviewMessage('Cole um link valido de video do YouTube antes de validar.');
      setPreviewItem(null);
      return;
    }

    if (!isSupportedYouTubeUrl(trimmedUrl)) {
      setPreviewStatus('error');
      setPreviewMessage('O link precisa ser do YouTube. Use youtube.com, youtu.be ou shorts.');
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
          ? 'Preview carregado com metadados basicos do video.'
          : ''
      );
    } catch (error) {
      setPreviewItem(null);
      setPreviewStatus('error');
      setPreviewMessage(error instanceof Error ? error.message : 'Falha ao carregar o preview do link.');
    }
  };

  const handleVideoUrlChange = (event) => {
    setVideoUrl(event.target.value);
    if (previewItem || previewStatus !== 'idle' || previewMessage) {
      setPreviewItem(null);
      setPreviewStatus('idle');
      setPreviewMessage('');
    }
  };

  const addPreviewToPlaylist = () => {
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
    setPlaylist((currentPlaylist) => currentPlaylist.filter((item) => getVideoId(item) !== videoId));
  };

  useEffect(() => {
    const allowedIds = new Set(componentOptions.map((component) => component.id));

    setSelectedComponentIds((currentIds) => currentIds.filter((id) => allowedIds.has(id)));
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
    const validationErrors = [];

    if (!scaleDate) {
      validationErrors.push('Selecione a data da escala.');
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

    const payload = {
      date: formatScaleDateForPayload(scaleDate),
      shift,
      components: selectedComponents.map((component) => ({
        componentId: component.id,
        function: functionsByComponent[component.id].trim()
      })),
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
      const responsePayload = await requestJson('/api/scales', {
        method: 'POST',
        body: payload
      });

      const successMessage =
        typeof responsePayload?.message === 'string' && responsePayload.message.trim()
          ? responsePayload.message.trim()
          : `Escala cadastrada com sucesso em ${formatDate(scaleDate)}.`;

      setSubmitMessage(successMessage);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Nao foi possivel cadastrar a escala agora. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.page} aria-label="Cadastro de escalas">
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Cadastro de escalas</p>
          <h1>Monte a escala, atribua funcoes e feche a playlist em um so fluxo.</h1>
          <p className={styles.description}>
            A tela segue a identidade visual das escalas do projeto, com cards limpos, gradientes quentes e foco na
            leitura rapida do que ja foi selecionado.
          </p>
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

      <div className={styles.formGrid} role="form" aria-label="Cadastro de escalas">
        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Data e turno</h2>
              <p>Defina quando a escala vai acontecer.</p>
            </div>

            <div className={styles.scheduleGrid}>
              <Calendar
                label="Data da escala"
                placeholder="Escolha a data no calendario"
                value={scaleDate}
                onChange={setScaleDate}
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

            {componentNotice.message ? (
              <p
                className={styles.inlineMessage}
                role={componentNotice.type === 'status' ? 'status' : 'alert'}
                aria-live="polite"
              >
                {componentNotice.message}
              </p>
            ) : null}

            <div className={styles.componentGrid}>
              {componentOptions.map((component) => {
                const isSelected = selectedComponentIds.includes(component.id);

                return (
                  <article
                    key={component.id}
                    className={`${styles.componentCard} ${isSelected ? styles.componentCardSelected : ''}`}
                  >
                    <button
                      type="button"
                      className={styles.componentToggle}
                      onClick={() => toggleComponent(component.id)}
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
                        {isSelected ? 'Selecionado' : 'Selecionar'}
                      </span>
                    </button>

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
                  </article>
                );
              })}
            </div>

            <div className={styles.selectionSummary}>
              <span>{selectedComponents.length} componente(s) selecionado(s)</span>
              <span>{selectedFunctionsCount} funcao(oes) selecionada(s)</span>
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
                  placeholder="Pesquisar musica, ministerio ou louvor"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      searchYouTube(event);
                    }
                  }}
                />
              </label>
              <button className={styles.primaryButton} type="button" onClick={searchYouTube} disabled={searchStatus === 'loading'}>
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
                          disabled={isAdded}
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
              <p>Cole um link valido do YouTube, carregue o preview e adicione na playlist.</p>
            </div>

            <div className={styles.searchForm}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>URL do video</span>
                <input
                  className={styles.searchInput}
                  type="url"
                  value={videoUrl}
                  onChange={handleVideoUrlChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  inputMode="url"
                  autoComplete="off"
                />
              </label>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={loadPreview}
                disabled={previewStatus === 'loading'}
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
                    {previewItem.previewSource === 'fallback' ? 'Preview basico' : 'Preview confirmado'}
                  </span>
                  <strong>{previewItem.title}</strong>
                  <span>{previewItem.channelTitle}</span>
                  <a className={styles.previewUrl} href={previewItem.url} target="_blank" rel="noreferrer noopener">
                    Abrir video no YouTube
                  </a>
                </div>

                <button type="button" className={styles.secondaryButton} onClick={addPreviewToPlaylist}>
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

            <button className={styles.primaryButton} type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar escala'}
            </button>
          </section>
        </aside>
      </div>
    </section>
  );
}
