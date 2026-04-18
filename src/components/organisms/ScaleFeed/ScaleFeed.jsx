'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthSession } from '@/context/AuthSessionContext';
import { requestJson } from '@/lib/api/http';
import styles from './ScaleFeed.module.css';

const COMPONENTS_VIEW = 'components';
const PLAYLIST_VIEW = 'playlist';
const COMMENTS_VIEW = 'comments';
const IMAGES_VIEW = 'images';
const MESSAGE_TYPE_TEXT = 'text';
const CURRENT_USER_ID = 'current-user';
const COMPONENT_APP_PERMISSION_MESSAGE =
  'Seu perfil de componente pode visualizar os cards e enviar mensagens, mas notificacoes e edicao geral continuam bloqueadas.';
const CURRENT_USER_BADGE_LABEL = 'Você';

const COMBINING_MARKS_PATTERN = /[\u0300-\u036f]/g;

function normalizeComparableText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(COMBINING_MARKS_PATTERN, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function toSlugText(value) {
  return normalizeComparableText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getUsernameSlugCandidates(user) {
  const values = [];

  if (typeof user?.username === 'string') {
    values.push(user.username);

    const usernameLocalPart = user.username.includes('@') ? user.username.split('@')[0] : '';
    if (usernameLocalPart && usernameLocalPart !== user.username) {
      values.push(usernameLocalPart);
    }
  }

  if (typeof user?.identifier === 'string') {
    values.push(user.identifier);
  }

  if (typeof user?.email === 'string') {
    const emailLocalPart = user.email.split('@')[0];
    if (emailLocalPart) {
      values.push(emailLocalPart);
    }
  }

  return values
    .map((value) => toSlugText(value))
    .filter(Boolean);
}

function getNameMatchCandidates(user) {
  return [user?.name, user?.displayName]
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => normalizeComparableText(value))
    .filter(Boolean);
}

function getMemberNameCandidates(member) {
  return [member?.name, member?.displayName]
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => normalizeComparableText(value))
    .filter(Boolean);
}

function isCurrentUserMember(member, authUser) {
  if (!member || !authUser) {
    return false;
  }

  const userNameCandidates = getNameMatchCandidates(authUser);
  const memberNameCandidates = getMemberNameCandidates(member);

  if (
    userNameCandidates.length &&
    memberNameCandidates.some((candidate) => userNameCandidates.includes(candidate))
  ) {
    return true;
  }

  const userSlugCandidates = getUsernameSlugCandidates(authUser);
  if (!userSlugCandidates.length) {
    return false;
  }

  const memberSlugCandidates = [member?.name, member?.displayName, member?.username]
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => toSlugText(value))
    .filter(Boolean);

  return memberSlugCandidates.some((candidate) => userSlugCandidates.includes(candidate));
}

function getCurrentUserMemberId(members, authUser) {
  return (Array.isArray(members) ? members : []).find((member) => isCurrentUserMember(member, authUser))?.id || null;
}

function createUploadedImageAttachment(file, scaleId, scaleDate, scaleShift) {
  return {
    id: `uploaded-${scaleId}-${Date.now()}`,
    src: URL.createObjectURL(file),
    alt: file?.name ? `Imagem enviada do dispositivo: ${file.name}` : `Imagem enviada do dispositivo para ${scaleDate} (${scaleShift})`,
    label: file?.name ? file.name : 'Imagem do dispositivo',
    sourceScaleId: scaleId,
    sourceScaleLabel: `${scaleDate} - ${scaleShift}`,
    isLocalUpload: true
  };
}

function collectImageLibrary(scales) {
  const seen = new Set();
  const imageLibrary = [];

  scales.forEach((scale) => {
    const imageAttachment = scale?.imageAttachment;
    if (!imageAttachment) {
      return;
    }

    const uniqueKey = imageAttachment.id || imageAttachment.src;
    if (!uniqueKey || seen.has(uniqueKey)) {
      return;
    }

    seen.add(uniqueKey);
    imageLibrary.push({
      ...imageAttachment,
      sourceScaleId: imageAttachment.sourceScaleId || scale.id,
      sourceScaleLabel:
        imageAttachment.sourceScaleLabel || `${scale.date || 'Data nao informada'} - ${scale.shift || 'Turno nao informado'}`
    });
  });

  return imageLibrary;
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

function extractScalePermissionData(payload) {
  const candidate =
    (payload?.item && typeof payload.item === 'object' && payload.item) ||
    (payload?.data && typeof payload.data === 'object' && payload.data) ||
    (payload?.scale && typeof payload.scale === 'object' && payload.scale) ||
    (payload && typeof payload === 'object' ? payload : null);

  if (!candidate) {
    return null;
  }

  const permissionSource =
    (candidate.permissions && typeof candidate.permissions === 'object' ? candidate.permissions : null) || candidate;

  return {
    playlistEditorComponentIds: normalizePermissionComponentIds(
      permissionSource.playlistEditorComponentIds || permissionSource.playlistEditors
    ),
    imageEditorComponentIds: normalizePermissionComponentIds(
      permissionSource.imageEditorComponentIds || permissionSource.imageEditors
    )
  };
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
        id: videoId || `playlist-${index}`,
        videoId,
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

function extractVideoIdFromUrl(videoUrl) {
  try {
    const parsedUrl = new URL(videoUrl);
    const host = parsedUrl.hostname.toLowerCase();

    if (host.includes('youtube.com')) {
      if (parsedUrl.pathname.startsWith('/shorts/')) {
        return parsedUrl.pathname.split('/')[2] || '';
      }

      return parsedUrl.searchParams.get('v') || '';
    }

    if (host.includes('youtu.be')) {
      return parsedUrl.pathname.replace('/', '');
    }

    if (host.includes('vimeo.com')) {
      return parsedUrl.pathname.split('/').filter(Boolean)[0] || '';
    }

    return '';
  } catch {
    return '';
  }
}

function isSupportedPlaylistUrl(value) {
  try {
    const parsedUrl = new URL(value);
    const host = parsedUrl.hostname.toLowerCase();

    return (
      host.includes('youtube.com') ||
      host.includes('youtu.be') ||
      host.includes('vimeo.com')
    );
  } catch {
    return false;
  }
}

function createPlaylistItemFromLink(rawUrl, currentLength) {
  const url = rawUrl.trim();
  const extractedVideoId = extractVideoIdFromUrl(url);
  const fallbackId = `manual-${Date.now()}`;

  return {
    id: extractedVideoId || fallbackId,
    videoId: extractedVideoId || fallbackId,
    title: `Link adicionado ${currentLength + 1}`,
    channelTitle: 'Link manual',
    url,
    videoUrl: url,
    thumbnailUrl: ''
  };
}

function toEmbedUrl(videoUrl) {
  try {
    const parsedUrl = new URL(videoUrl);
    const host = parsedUrl.hostname.toLowerCase();

    if (host.includes('youtube.com')) {
      if (parsedUrl.pathname.startsWith('/embed/')) {
        return videoUrl;
      }

      if (parsedUrl.pathname.startsWith('/shorts/')) {
        const shortId = parsedUrl.pathname.split('/')[2];
        return shortId ? `https://www.youtube.com/embed/${shortId}` : null;
      }

      const videoId = parsedUrl.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host.includes('youtu.be')) {
      const shortId = parsedUrl.pathname.replace('/', '');
      return shortId ? `https://www.youtube.com/embed/${shortId}` : null;
    }

    if (host.includes('vimeo.com')) {
      const vimeoId = parsedUrl.pathname.split('/').filter(Boolean)[0];
      return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

function groupMembers(members) {
  const leader = members.find((member) => member.isLeader) || null;
  const groupedMap = new Map();

  members
    .filter((member) => !member.isLeader)
    .forEach((member) => {
      const roleKey = member.role || 'Sem funcao definida';
      const currentGroup = groupedMap.get(roleKey) || [];
      currentGroup.push(member);
      groupedMap.set(roleKey, currentGroup);
    });

  const groupedByRole = Array.from(groupedMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
    .map(([role, roleMembers]) => ({ role, members: roleMembers }));

  return { leader, groupedByRole };
}

function createTextMessage({ id, text, authorId, authorName, createdAt }) {
  return {
    id,
    type: MESSAGE_TYPE_TEXT,
    payload: {
      text
    },
    meta: {
      authorId,
      authorName,
      createdAt,
      status: 'sent'
    }
  };
}

function normalizeMessage(message, index) {
  if (!message || typeof message !== 'object') {
    return createTextMessage({
      id: `message-fallback-${index}`,
      text: '',
      authorId: 'unknown',
      authorName: 'Desconhecido',
      createdAt: new Date().toISOString()
    });
  }

  const type = message.type || MESSAGE_TYPE_TEXT;
  const payload = message.payload || {};
  const meta = message.meta || {};

  if (type === MESSAGE_TYPE_TEXT) {
    return {
      id: message.id || `message-${index}`,
      type,
      payload: {
        text: typeof payload.text === 'string' ? payload.text : typeof message.text === 'string' ? message.text : ''
      },
      meta: {
        authorId: meta.authorId || message.authorId || 'unknown',
        authorName: meta.authorName || message.authorName || 'Membro',
        createdAt: meta.createdAt || message.createdAt || new Date().toISOString(),
        status: meta.status || 'sent'
      }
    };
  }

  return {
    id: message.id || `message-${index}`,
    type,
    payload,
    meta: {
      authorId: meta.authorId || 'unknown',
      authorName: meta.authorName || 'Membro',
      createdAt: meta.createdAt || new Date().toISOString(),
      status: meta.status || 'sent'
    }
  };
}

function formatMessageTime(isoDate) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(isoDate));
  } catch {
    return '--:--';
  }
}

function ScaleImageGallery({ currentImage, imageLibrary, onSelectImage }) {
  if (!imageLibrary.length) {
    return null;
  }

  return (
    <div className={styles.imageGallery} aria-label="Imagens anteriores da escala">
      {imageLibrary.map((image) => {
        const isSelected = Boolean(currentImage && currentImage.id === image.id);

        return (
          <button
            key={image.id || image.src}
            type="button"
            className={`${styles.imageGalleryItem} ${isSelected ? styles.imageGalleryItemActive : ''}`}
            onClick={() => onSelectImage(image)}
            aria-pressed={isSelected}
            aria-label={`${isSelected ? 'Imagem selecionada' : 'Selecionar imagem'}: ${image.label || image.alt}`}
          >
            <span className={styles.imageThumbWrap} aria-hidden="true">
              <Image
                className={styles.imageThumb}
                src={image.src}
                alt=""
                width={92}
                height={92}
                unoptimized
              />
            </span>
            <span className={styles.imageGalleryMeta}>
              <strong>{image.label || 'Imagem anterior'}</strong>
              <span>{image.sourceScaleLabel || 'Imagem reutilizavel'}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ScaleImagePanel({
  scaleId,
  scaleDate,
  scaleShift,
  currentImage,
  imageLibrary,
  canEditImage,
  onRestrictedAction,
  onRemoveImage,
  onSelectImage,
  onUploadImage
}) {
  const hasCurrentImage = Boolean(currentImage);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const fileInputRef = useRef(null);
  const previousBodyOverflowRef = useRef('');
  const galleryId = `image-gallery-${makeDomId(scaleId)}`;
  const fullscreenTitleId = `image-fullscreen-title-${makeDomId(scaleId)}`;
  const fullscreenDescriptionId = `image-fullscreen-description-${makeDomId(scaleId)}`;

  useEffect(() => {
    setIsGalleryVisible(false);
  }, [currentImage]);

  useEffect(() => {
    if (!hasCurrentImage) {
      setIsFullscreenOpen(false);
    }
  }, [hasCurrentImage]);

  useEffect(() => {
    if (!isFullscreenOpen) {
      return undefined;
    }

    previousBodyOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && window.matchMedia('(min-width: 701px)').matches) {
        setIsFullscreenOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflowRef.current;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreenOpen]);

  const handleOpenUpload = () => {
    if (!canEditImage) {
      onRestrictedAction?.();
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      event.target.value = '';
      return;
    }

    onUploadImage(file);
    event.target.value = '';
  };

  const handleSelectImageFromGallery = (image) => {
    if (!canEditImage) {
      onRestrictedAction?.();
      return;
    }

    onSelectImage(image);
  };

  const handleOpenFullscreen = () => {
    if (!hasCurrentImage) {
      return;
    }

    setIsFullscreenOpen(true);
  };

  const handleCloseFullscreen = () => {
    setIsFullscreenOpen(false);
  };

  return (
    <section className={styles.imagesPanel} aria-label="Bloco de imagens da escala">
      {hasCurrentImage ? (
        <div className={styles.imageHero}>
          <div className={styles.imagePreviewFrame}>
            <Image
              className={styles.imagePreview}
              src={currentImage.src}
              alt={currentImage.alt || currentImage.label || `Imagem da escala ${scaleDate} (${scaleShift})`}
              fill
              sizes="(max-width: 700px) 100vw, 520px"
              unoptimized
            />

            <button
              type="button"
              className={styles.imageFullscreenButton}
              onClick={handleOpenFullscreen}
              aria-label={`Abrir imagem da escala de ${scaleDate} (${scaleShift}) em tela cheia`}
              title="Abrir em tela cheia"
            />

            <button
              type="button"
              className={styles.imageRemoveButton}
              onClick={onRemoveImage}
              disabled={!canEditImage}
              aria-label={`Remover imagem da escala de ${scaleDate} (${scaleShift})`}
              aria-disabled={!canEditImage}
              title="Remover imagem"
            >
              <IconRemove />
            </button>
          </div>

          {isFullscreenOpen ? (
            <div
              className={styles.imageFullscreenOverlay}
              role="dialog"
              aria-modal="true"
              aria-labelledby={fullscreenTitleId}
              aria-describedby={fullscreenDescriptionId}
            >
              <div className={styles.imageFullscreenContent}>
                <h2 id={fullscreenTitleId} className={styles.imageFullscreenTitle}>
                  Imagem da escala
                </h2>
                <p id={fullscreenDescriptionId} className={styles.imageFullscreenDescription}>
                  {scaleDate} ({scaleShift})
                </p>
                <div className={styles.imageFullscreenMediaWrap}>
                  <Image
                    className={styles.imageFullscreenMedia}
                    src={currentImage.src}
                    alt={currentImage.alt || currentImage.label || `Imagem da escala ${scaleDate} (${scaleShift})`}
                    fill
                    sizes="100vw"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  className={styles.imageFullscreenCloseButton}
                  onClick={handleCloseFullscreen}
                  aria-label="Fechar visualizacao da imagem em tela cheia"
                >
                  Fechar visualizacao
                </button>
              </div>
            </div>
          ) : null}

          {!canEditImage ? (
            <p className={styles.imageHint}>Somente componentes autorizados podem editar esta imagem.</p>
          ) : null}
        </div>
      ) : (
        <div className={styles.imageEmptyState}>
          <p className={styles.imageEmptyText}>Esta escala ainda nao possui imagem vinculada.</p>

          <div className={styles.imageEmptyActions}>
            {imageLibrary.length ? (
              <button
                type="button"
                className={styles.imageSecondaryButton}
                onClick={() => setIsGalleryVisible((current) => !current)}
                aria-expanded={isGalleryVisible}
                aria-controls={galleryId}
                aria-label={`${isGalleryVisible ? 'Ocultar' : 'Visualizar'} galeria de imagens do grupo`}
              >
                {isGalleryVisible ? 'Ocultar galeria do grupo' : 'Visualizar galeria do grupo'}
              </button>
            ) : (
              <p className={styles.imageHint}>Nenhuma imagem anterior foi encontrada em outras escalas.</p>
            )}

            <button
              type="button"
              className={styles.imagePrimaryButton}
              onClick={handleOpenUpload}
              disabled={!canEditImage}
              aria-label={`Fazer upload de imagem para a escala de ${scaleDate} (${scaleShift})`}
              aria-disabled={!canEditImage}
            >
              Upload do dispositivo
            </button>
            <input
              ref={fileInputRef}
              className={styles.imageUploadInput}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              aria-label={`Selecionar imagem do dispositivo para a escala de ${scaleDate} (${scaleShift})`}
            />
          </div>

          {!canEditImage ? (
            <p className={styles.imageHint}>Somente componentes autorizados podem editar esta imagem.</p>
          ) : null}

          {imageLibrary.length && isGalleryVisible ? (
            <div className={styles.imageChoices} id={galleryId}>
              <div className={styles.imageChoicesHeader}>
                <h3>Imagens anteriores</h3>
                <span>
                  {imageLibrary.length === 1 ? '1 imagem disponivel' : `${imageLibrary.length} imagens disponiveis`}
                </span>
              </div>

              <ScaleImageGallery
                currentImage={currentImage}
                imageLibrary={imageLibrary}
                onSelectImage={handleSelectImageFromGallery}
              />
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function MemberRow({ member, leader = false, isCurrentUser = false }) {
  return (
    <article
      className={`${styles.memberRow} ${leader ? styles.memberLeader : ''} ${
        isCurrentUser ? styles.memberCurrentUser : ''
      }`}
    >
      <Image
        className={styles.memberPhoto}
        src={member.photo}
        alt={`Foto de ${member.name}`}
        width={40}
        height={40}
        unoptimized
      />
      <div className={styles.memberInfo}>
        <strong>{member.name}</strong>
        <span>{member.role}</span>
      </div>
      <div className={styles.memberBadges}>
        {leader ? <span className={styles.leaderBadge}>Lider</span> : null}
        {isCurrentUser ? <span className={styles.currentUserBadge}>{CURRENT_USER_BADGE_LABEL}</span> : null}
      </div>
    </article>
  );
}

function ComponentsPanel({ members, currentUser }) {
  const { leader, groupedByRole } = useMemo(() => groupMembers(members), [members]);
  const currentUserMemberId = useMemo(
    () => members.find((member) => isCurrentUserMember(member, currentUser))?.id || null,
    [members, currentUser]
  );

  if (!members.length) {
    return <p className={styles.emptyState}>Nenhum componente escalado para esta data.</p>;
  }

  return (
    <div className={styles.componentsPanel}>
      {leader ? (
        <section className={styles.roleSection} aria-label="Lider da escala">
          <h3>Lideranca</h3>
          <MemberRow member={leader} leader isCurrentUser={leader.id === currentUserMemberId} />
        </section>
      ) : null}

      {groupedByRole.map((group) => (
        <section className={styles.roleSection} key={group.role} aria-label={`Funcao ${group.role}`}>
          <h3>{group.role}</h3>
          {group.members.map((member) => (
            <MemberRow key={member.id} member={member} isCurrentUser={member.id === currentUserMemberId} />
          ))}
        </section>
      ))}
    </div>
  );
}

function PlaylistPanel({
  scaleId,
  playlist,
  canEditPlaylist,
  isSavingPlaylist,
  onRestrictedAction,
  onPersistPlaylist
}) {
  const linkFieldId = `playlist-link-${makeDomId(scaleId)}`;
  const emptyLinkFieldId = `playlist-link-empty-${makeDomId(scaleId)}`;
  const [draftLink, setDraftLink] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setCurrentIndex((prevIndex) => (playlist.length ? Math.min(prevIndex, playlist.length - 1) : 0));
    setFeedback('');
  }, [playlist]);

  const addVideoLink = async (event) => {
    event.preventDefault();

    if (!canEditPlaylist) {
      setFeedback('Seu perfil nao tem permissao para editar esta playlist.');
      onRestrictedAction?.();
      return;
    }

    const nextLink = draftLink.trim();
    if (!nextLink) {
      setFeedback('Cole um link antes de adicionar.');
      return;
    }

    if (!isSupportedPlaylistUrl(nextLink)) {
      setFeedback('Use um link valido de YouTube ou Vimeo.');
      return;
    }

    const nextItem = createPlaylistItemFromLink(nextLink, playlist.length);
    const alreadyExists = playlist.some(
      (item) =>
        (nextItem.videoId && (item.videoId === nextItem.videoId || item.id === nextItem.videoId)) ||
        item.videoUrl === nextItem.videoUrl
    );

    if (alreadyExists) {
      setFeedback('Este link ja existe na playlist desta escala.');
      return;
    }

    const nextPlaylist = [...playlist, nextItem];

    try {
      await onPersistPlaylist(nextPlaylist);
      setDraftLink('');
      setCurrentIndex(nextPlaylist.length - 1);
      setFeedback('Link adicionado e salvo na playlist da escala.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel adicionar o link na playlist.');
    }
  };

  const removeVideo = async (videoId) => {
    if (!canEditPlaylist) {
      setFeedback('Seu perfil nao tem permissao para editar esta playlist.');
      onRestrictedAction?.();
      return;
    }

    const nextPlaylist = playlist.filter((item) => item.id !== videoId && item.videoId !== videoId);

    try {
      await onPersistPlaylist(nextPlaylist);
      setCurrentIndex((prev) => (nextPlaylist.length ? Math.min(prev, nextPlaylist.length - 1) : 0));
      setFeedback(
        nextPlaylist.length
          ? 'Video removido e playlist atualizada no banco.'
          : 'Video removido. A playlist desta escala ficou vazia.'
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel remover o video da playlist.');
    }
  };

  if (!playlist.length) {
    return (
      <div className={styles.playlistPanel}>
        {canEditPlaylist ? (
          <form className={styles.playlistAddForm} onSubmit={addVideoLink}>
            <label className={styles.playlistFieldLabel} htmlFor={emptyLinkFieldId}>
              Adicionar novo link
            </label>
            <div className={styles.playlistInputRow}>
              <input
                id={emptyLinkFieldId}
                type="url"
                className={styles.playlistLinkInput}
                placeholder="https://youtube.com/watch?v=..."
                value={draftLink}
                onChange={(event) => setDraftLink(event.target.value)}
                autoComplete="off"
              />
              <button type="submit" className={styles.playlistAddButton} disabled={isSavingPlaylist}>
                {isSavingPlaylist ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        ) : null}

        <p className={styles.emptyState}>Nenhum video disponivel nesta playlist.</p>
        {feedback ? (
          <p className={styles.playlistFeedback} role="status" aria-live="polite">
            {feedback}
          </p>
        ) : null}
      </div>
    );
  }

  const currentVideo = playlist[currentIndex];
  const embedUrl = toEmbedUrl(currentVideo.videoUrl);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? playlist.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === playlist.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={styles.playlistPanel}>
      <div className={styles.videoFrameWrap}>
        {embedUrl ? (
          <iframe
            className={styles.videoFrame}
            src={embedUrl}
            title={currentVideo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className={styles.videoFallback}>
            <p>Nao foi possivel incorporar este video.</p>
            <a href={currentVideo.videoUrl} target="_blank" rel="noreferrer noopener">
              Abrir link do video
            </a>
          </div>
        )}
      </div>

      <div className={styles.carouselFooter}>
        <button type="button" className={styles.navButton} onClick={goToPrevious} aria-label="Video anterior">
          Anterior
        </button>
        <p className={styles.videoTitle}>{currentVideo.title}</p>
        <button type="button" className={styles.navButton} onClick={goToNext} aria-label="Proximo video">
          Proximo
        </button>
      </div>

      <div className={styles.carouselDots} aria-label="Seletor de videos">
        {playlist.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Abrir video ${index + 1}: ${item.title}`}
            aria-pressed={index === currentIndex}
          />
        ))}
      </div>

      <div className={styles.playlistEditorWrap}>
        <div className={styles.playlistEditorHeader}>
          <h3>{canEditPlaylist ? 'Editar playlist' : 'Playlist da escala'}</h3>
          <span>{canEditPlaylist ? 'Adicione links e remova videos da lista.' : 'Visualizacao apenas.'}</span>
        </div>

        {canEditPlaylist ? (
          <>
            <form className={styles.playlistAddForm} onSubmit={addVideoLink}>
              <label className={styles.playlistFieldLabel} htmlFor={linkFieldId}>
                Novo link da playlist
              </label>
              <div className={styles.playlistInputRow}>
                <input
                  id={linkFieldId}
                  type="url"
                  className={styles.playlistLinkInput}
                  placeholder="https://youtube.com/watch?v=..."
                  value={draftLink}
                  onChange={(event) => setDraftLink(event.target.value)}
                  autoComplete="off"
                />
                <button type="submit" className={styles.playlistAddButton} disabled={isSavingPlaylist}>
                  {isSavingPlaylist ? 'Salvando...' : 'Adicionar'}
                </button>
              </div>
            </form>

            <div className={styles.playlistEditorList}>
              {playlist.map((item, index) => (
              <article key={item.id} className={styles.playlistEditorItem}>
                <div className={styles.playlistEditorCopy}>
                  <strong>{index + 1}. {item.title}</strong>
                  <span>{item.channelTitle || 'Canal nao informado'}</span>
                </div>
                <button
                  type="button"
                  className={styles.playlistRemoveButton}
                  disabled={isSavingPlaylist}
                  onClick={() => removeVideo(item.id || item.videoId)}
                  aria-label={`Remover ${item.title} da playlist`}
                >
                  Remover
                </button>
              </article>
              ))}
            </div>
          </>
        ) : (
          <p className={styles.playlistHint}>Somente componentes autorizados podem editar esta playlist.</p>
        )}
      </div>

      {feedback ? (
        <p className={styles.playlistFeedback} role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}

function MessageBubble({ message }) {
  const isCurrentUser = message.meta.authorId === CURRENT_USER_ID;

  if (message.type !== MESSAGE_TYPE_TEXT) {
    return (
      <article className={`${styles.messageRow} ${isCurrentUser ? styles.messageRowSelf : ''}`}>
        <div className={`${styles.messageBubble} ${isCurrentUser ? styles.messageBubbleSelf : ''}`}>
          <p className={styles.messageText}>Tipo de mensagem ainda nao suportado.</p>
          <span className={styles.messageMeta}>{formatMessageTime(message.meta.createdAt)}</span>
        </div>
      </article>
    );
  }

  return (
    <article className={`${styles.messageRow} ${isCurrentUser ? styles.messageRowSelf : ''}`}>
      <div className={`${styles.messageBubble} ${isCurrentUser ? styles.messageBubbleSelf : ''}`}>
        {!isCurrentUser ? <strong className={styles.messageAuthor}>{message.meta.authorName}</strong> : null}
        <p className={styles.messageText}>{message.payload.text}</p>
        <span className={styles.messageMeta}>{formatMessageTime(message.meta.createdAt)}</span>
      </div>
    </article>
  );
}

function CommentsPanel({ scaleId, initialMessages }) {
  const [messages, setMessages] = useState(() => (initialMessages || []).map(normalizeMessage));
  const [draft, setDraft] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextText = draft.trim();
    if (!nextText) {
      setFeedback('Digite uma mensagem antes de enviar.');
      return;
    }

    const nextMessage = createTextMessage({
      id: `${scaleId}-msg-${Date.now()}`,
      text: nextText,
      authorId: CURRENT_USER_ID,
      authorName: 'Voce',
      createdAt: new Date().toISOString()
    });

    setMessages((current) => [...current, nextMessage]);
    setDraft('');
    setFeedback('Mensagem enviada.');
  };

  return (
    <section className={styles.commentsPanel} aria-label="Comentarios da escala">
      <div className={styles.messagesList}>
        {!messages.length ? (
          <p className={styles.emptyState}>Sem mensagens ainda. Inicie a conversa da escala por aqui.</p>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
      </div>

      <form className={styles.composer} onSubmit={handleSubmit}>
        <label className={styles.composerLabel} htmlFor={`composer-${scaleId}`}>
          Mensagem
        </label>
        <div className={styles.composerControls}>
          <input
            id={`composer-${scaleId}`}
            type="text"
            className={styles.composerInput}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escreva uma mensagem"
            autoComplete="off"
          />
          <button type="submit" className={styles.sendButton} aria-label="Enviar mensagem">
            <IconSend />
          </button>
        </div>
      </form>

      {feedback ? (
        <p className={styles.chatNotice} role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}

function makeDomId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, '-');
}

function IconComments() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-5.2L7 19.6V15H7a3 3 0 0 1-3-3V5Z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M16 7a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0Zm9 10a5 5 0 0 0-10 0v2h10v-2Zm11 2v-1a4 4 0 0 0-6-3.46V20h6Z" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4.5v15l12-7.5L7 4.5Z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2a6 6 0 0 0-6 6v3.54c0 .8-.32 1.56-.88 2.12L3.29 15.5a1 1 0 0 0 .71 1.7H20a1 1 0 0 0 .71-1.7l-1.83-1.84a3 3 0 0 1-.88-2.12V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 2.82-2H9.18A3 3 0 0 0 12 22Z" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m3 17.25 9.06-9.06 3.75 3.75L6.75 21H3v-3.75Zm14.71-8.46a1 1 0 0 0 0-1.41l-1.09-1.09a1 1 0 0 0-1.41 0l-1.72 1.72 3.75 3.75 1.47-1.47Z" />
    </svg>
  );
}

function IconChevron({ expanded }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={expanded ? styles.chevronExpanded : ''}>
      <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41Z" />
    </svg>
  );
}

function IconSend() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2 .01 7Z" />
    </svg>
  );
}

function IconRemove() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6.7 5.3 5.3 6.7 10.6 12 5.3 17.3l1.4 1.4 5.3-5.3 5.3 5.3 1.4-1.4-5.3-5.3 5.3-5.3-1.4-1.4-5.3 5.3-5.3-5.3Z" />
    </svg>
  );
}

function ScaleCard({
  scale,
  scaleId,
  isExpanded,
  onToggleExpand,
  onEdit,
  imageLibrary,
  isComponentApp,
  currentUser
}) {
  const [activeView, setActiveView] = useState(COMPONENTS_VIEW);
  const [notifyFeedback, setNotifyFeedback] = useState('');
  const [isNotifying, setIsNotifying] = useState(false);
  const [currentImage, setCurrentImage] = useState(() => scale.imageAttachment || null);
  const [currentPlaylist, setCurrentPlaylist] = useState(() => normalizeScalePlaylist(scale.playlist));
  const [imageFeedback, setImageFeedback] = useState('');
  const [playlistFeedback, setPlaylistFeedback] = useState('');
  const [isPlaylistSaving, setIsPlaylistSaving] = useState(false);
  const scaleDate = scale?.date || 'Data nao informada';
  const scaleShift = scale?.shift || 'Turno nao informado';
  const hasResolvedAuthSession = Boolean(currentUser);
  const currentUserMemberId = useMemo(() => getCurrentUserMemberId(scale.members, currentUser), [scale.members, currentUser]);
  const playlistEditorComponentIds = Array.isArray(scale.playlistEditorComponentIds)
    ? scale.playlistEditorComponentIds
    : [];
  const imageEditorComponentIds = Array.isArray(scale.imageEditorComponentIds)
    ? scale.imageEditorComponentIds
    : [];
  const canEditPlaylist =
    hasResolvedAuthSession &&
    (!isComponentApp || (currentUserMemberId ? playlistEditorComponentIds.includes(currentUserMemberId) : false));
  const canEditImage =
    hasResolvedAuthSession &&
    (!isComponentApp || (currentUserMemberId ? imageEditorComponentIds.includes(currentUserMemberId) : false));
  const detailsId = `scale-card-${makeDomId(scale?.id || `${scaleDate}-${scaleShift}`)}-details`;

  useEffect(() => {
    setCurrentPlaylist(normalizeScalePlaylist(scale.playlist));
  }, [scale.playlist]);

  const handleNotify = async () => {
    if (isComponentApp) {
      setNotifyFeedback(COMPONENT_APP_PERMISSION_MESSAGE);
      return;
    }

    if (isNotifying) {
      return;
    }

    if (!scaleId) {
      setNotifyFeedback('Nao foi possivel identificar a escala para notificar.');
      return;
    }

    setIsNotifying(true);

    try {
      const payload = await requestJson(`/api/scales/${encodeURIComponent(scaleId)}/notify`, {
        method: 'POST'
      });
      const apiMessageCandidates = [
        payload?.message,
        payload?.detail,
        payload?.data?.message,
        payload?.item?.message,
        payload?.notification?.message
      ];
      const apiMessage = apiMessageCandidates.find((value) => typeof value === 'string' && value.trim())?.trim();
      setNotifyFeedback(apiMessage || `Notificacao reenviada para ${scaleDate} (${scaleShift}).`);
    } catch (error) {
      setNotifyFeedback(error instanceof Error ? error.message : 'Nao foi possivel reenviar a notificacao.');
    } finally {
      setIsNotifying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (currentImage?.src?.startsWith('blob:')) {
        URL.revokeObjectURL(currentImage.src);
      }
    };
  }, [currentImage]);

  const handleRemoveImage = () => {
    if (!canEditImage) {
      setImageFeedback('Seu perfil nao tem permissao para editar esta imagem.');
      return;
    }

    if (currentImage?.src?.startsWith('blob:')) {
      URL.revokeObjectURL(currentImage.src);
    }

    setCurrentImage(null);
    setImageFeedback(`Imagem removida da escala ${scaleDate} (${scaleShift}).`);
  };

  const handleSelectImage = (image) => {
    if (!canEditImage) {
      setImageFeedback('Seu perfil nao tem permissao para editar esta imagem.');
      return;
    }

    setCurrentImage(image);
    setImageFeedback(`Imagem vinculada para ${scaleDate} (${scaleShift}).`);
  };

  const handleUploadImage = (file) => {
    if (!canEditImage) {
      setImageFeedback('Seu perfil nao tem permissao para editar esta imagem.');
      return;
    }

    if (!file) {
      return;
    }

    const nextImage = createUploadedImageAttachment(file, scaleId, scaleDate, scaleShift);
    setCurrentImage(nextImage);
    setImageFeedback(`Imagem enviada do dispositivo para ${scaleDate} (${scaleShift}).`);
  };

  const persistPlaylist = async (nextPlaylist) => {
    if (!canEditPlaylist) {
      throw new Error('Seu perfil nao tem permissao para editar esta playlist.');
    }

    setIsPlaylistSaving(true);

    try {
      const payload = await requestJson(`/api/scales/${encodeURIComponent(scaleId)}`, {
        method: 'PATCH',
        body: {
          playlist: nextPlaylist.map((item) => ({
            videoId: item.videoId || item.id || '',
            title: item.title || '',
            channelTitle: item.channelTitle || '',
            url: item.url || item.videoUrl || '',
            videoUrl: item.videoUrl || item.url || '',
            thumbnailUrl: item.thumbnailUrl || ''
          }))
        }
      });

      const nextSavedPlaylist = normalizeScalePlaylist(payload?.item?.playlist || nextPlaylist);
      setCurrentPlaylist(nextSavedPlaylist);
      setPlaylistFeedback('Playlist salva com sucesso.');
      return nextSavedPlaylist;
    } catch (error) {
      setPlaylistFeedback(error instanceof Error ? error.message : 'Nao foi possivel salvar a playlist.');
      throw error;
    } finally {
      setIsPlaylistSaving(false);
    }
  };

  return (
    <article className={`${styles.scaleCard} ${isExpanded ? styles.scaleCardExpanded : ''}`}>
      <header className={styles.cardHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerAvatar} aria-hidden="true">
            {scaleShift.slice(0, 1)}
          </div>
          <div className={styles.headerMeta}>
            <strong>{scaleDate}</strong>
            <span>Turno: {scaleShift}</span>
          </div>
        </div>

        <button
          type="button"
          className={styles.toggleButton}
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
          aria-controls={detailsId}
          aria-label={`${isExpanded ? 'Recolher' : 'Expandir'} escala de ${scaleDate} (${scaleShift})`}
          title={isExpanded ? 'Recolher escala' : 'Expandir escala'}
        >
          <IconChevron expanded={isExpanded} />
        </button>
      </header>

      <div className={styles.cardDetails} id={detailsId} hidden={!isExpanded} aria-hidden={!isExpanded}>
        <section className={styles.cardBody}>
          {activeView === COMPONENTS_VIEW ? (
            <ComponentsPanel members={scale.members} currentUser={currentUser} />
          ) : null}
          {activeView === PLAYLIST_VIEW ? (
            <PlaylistPanel
              scaleId={scaleId}
              playlist={currentPlaylist}
              canEditPlaylist={canEditPlaylist}
              isSavingPlaylist={isPlaylistSaving}
              onRestrictedAction={() => setNotifyFeedback('Seu perfil nao tem permissao para editar esta playlist.')}
              onPersistPlaylist={persistPlaylist}
            />
          ) : null}
          {activeView === COMMENTS_VIEW ? (
            <CommentsPanel scaleId={scaleId} initialMessages={scale.messages} />
          ) : null}
          {activeView === IMAGES_VIEW ? (
            <ScaleImagePanel
              scaleId={scaleId}
              scaleDate={scaleDate}
              scaleShift={scaleShift}
              currentImage={currentImage}
              imageLibrary={imageLibrary}
              canEditImage={canEditImage}
              onRestrictedAction={() => setImageFeedback('Seu perfil nao tem permissao para editar esta imagem.')}
              onRemoveImage={handleRemoveImage}
              onSelectImage={handleSelectImage}
              onUploadImage={handleUploadImage}
            />
          ) : null}
        </section>

        <footer className={styles.cardFooter}>
          <div className={styles.leftActions}>
            <button
              type="button"
              className={`${styles.iconButton} ${
                activeView === COMMENTS_VIEW ? styles.actionButtonActive : ''
              }`}
              onClick={() => setActiveView(COMMENTS_VIEW)}
              aria-pressed={activeView === COMMENTS_VIEW}
              aria-label="Abrir comentarios"
              title="Comentarios"
            >
              <IconComments />
            </button>
            <button
              type="button"
              className={`${styles.iconButton} ${
                activeView === COMPONENTS_VIEW ? styles.actionButtonActive : ''
              }`}
              onClick={() => setActiveView(COMPONENTS_VIEW)}
              aria-pressed={activeView === COMPONENTS_VIEW}
              aria-label="Abrir componentes"
              title="Componentes"
            >
              <IconUsers />
            </button>
            <button
              type="button"
              className={`${styles.iconButton} ${
                activeView === PLAYLIST_VIEW ? styles.actionButtonActive : ''
              }`}
              onClick={() => setActiveView(PLAYLIST_VIEW)}
              aria-pressed={activeView === PLAYLIST_VIEW}
              aria-label="Abrir playlist"
              title="Playlist"
            >
              <IconPlay />
            </button>
            <button
              type="button"
              className={`${styles.iconButton} ${
                activeView === IMAGES_VIEW ? styles.actionButtonActive : ''
              }`}
              onClick={() => setActiveView(IMAGES_VIEW)}
              aria-pressed={activeView === IMAGES_VIEW}
              aria-label="Abrir imagens"
              title="Imagens"
            >
              <IconImage />
            </button>
          </div>

          <div className={styles.rightActions}>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.notifyButton} ${
                isComponentApp ? styles.iconButtonDisabledPermission : ''
              }`}
              onClick={handleNotify}
              disabled={isComponentApp || isNotifying}
              aria-label={`${
                isNotifying ? 'Enviando notificacao para equipe da escala' : 'Notificar equipe da escala'
              } de ${scaleDate} (${scaleShift})`}
              aria-disabled={isComponentApp || isNotifying}
              title={isNotifying ? 'Enviando notificacao' : 'Notificar'}
            >
              <IconBell />
            </button>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.editButton} ${
                isComponentApp ? styles.iconButtonDisabledPermission : ''
              }`}
              onClick={() => onEdit(scale)}
              disabled={!scale.canEdit || isComponentApp}
              aria-label={`Editar escala de ${scaleDate} ${scaleShift}`}
              aria-disabled={!scale.canEdit || isComponentApp}
              title="Editar escala"
            >
              <IconEdit />
            </button>
          </div>
        </footer>

        {notifyFeedback ? (
          <p className={styles.cardNotice} role="status" aria-live="polite">
            {notifyFeedback}
          </p>
        ) : null}

        {imageFeedback ? (
          <p className={styles.cardNotice} role="status" aria-live="polite">
            {imageFeedback}
          </p>
        ) : null}

        {playlistFeedback ? (
          <p className={styles.cardNotice} role="status" aria-live="polite">
            {playlistFeedback}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default function ScaleFeed({
  scales,
  timeScope = 'current-and-future',
  onChangeTimeScope,
  timeScopeOptions = []
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [expandedScaleIds, setExpandedScaleIds] = useState({});
  const [hydratedScales, setHydratedScales] = useState(() => scales);
  const imageLibrary = useMemo(() => collectImageLibrary(hydratedScales), [hydratedScales]);
  const { user: authUser, permissions, isLoading: isAuthSessionLoading } = useAuthSession();
  const isComponentApp = !isAuthSessionLoading && Boolean(permissions.isComponentApp);

  useEffect(() => {
    let isActive = true;

    async function loadScalePermissions() {
      if (!Array.isArray(scales) || !scales.length) {
        setHydratedScales([]);
        return;
      }

      const listAlreadyHasPermissions = scales.every(
        (scale) =>
          Array.isArray(scale?.playlistEditorComponentIds) &&
          Array.isArray(scale?.imageEditorComponentIds)
      );

      if (listAlreadyHasPermissions) {
        setHydratedScales(scales);
        return;
      }

      try {
        const nextScales = await Promise.all(
          scales.map(async (scale) => {
            if (!scale?.id) {
              return scale;
            }

            try {
              const payload = await requestJson(`/api/scales/${encodeURIComponent(scale.id)}`, {
                method: 'GET',
                cache: 'no-store'
              });
              const permissionData = extractScalePermissionData(payload);

              return permissionData ? { ...scale, ...permissionData } : scale;
            } catch {
              return scale;
            }
          })
        );

        if (isActive) {
          setHydratedScales(nextScales);
        }
      } catch {
        if (isActive) {
          setHydratedScales(scales);
        }
      }
    }

    loadScalePermissions();

    return () => {
      isActive = false;
    };
  }, [scales]);

  useEffect(() => {
    if (isAuthSessionLoading) {
      return;
    }

    setFeedback((current) => {
      if (isComponentApp) {
        return COMPONENT_APP_PERMISSION_MESSAGE;
      }

      return current === COMPONENT_APP_PERMISSION_MESSAGE ? '' : current;
    });
  }, [isAuthSessionLoading, isComponentApp]);

  const handleEdit = (scale) => {
    if (isComponentApp) {
      setFeedback(COMPONENT_APP_PERMISSION_MESSAGE);
      return;
    }

    if (!scale.canEdit) {
      setFeedback(`Voce nao possui permissao para editar a escala de ${scale.date} (${scale.shift}).`);
      return;
    }

    router.push(`/cadastro-escalas?scaleId=${encodeURIComponent(scale.id)}`);
  };

  return (
    <section className={styles.feedPage} aria-label="Feed de escalas">
      <header className={styles.feedHeader}>
        <div className={styles.feedHeaderTopRow}>
          <h1>Escalas</h1>
          {typeof onChangeTimeScope === 'function' && timeScopeOptions.length ? (
            <div className={styles.feedFilterControl}>
              <label htmlFor="scales-time-scope">Filtro</label>
              <select
                id="scales-time-scope"
                className={styles.feedFilterSelect}
                value={timeScope}
                onChange={(event) => onChangeTimeScope(event.target.value)}
                aria-label="Filtrar periodo das escalas"
              >
                {timeScopeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
        <p>Por padrao, exibindo escalas de hoje e datas futuras.</p>
      </header>

      {feedback ? (
        <p className={styles.feedback} role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}

      {!hydratedScales.length ? (
        <p className={styles.emptyState}>Nenhuma escala encontrada.</p>
      ) : null}

      <div className={styles.feedList}>
        {hydratedScales.map((scale, index) => {
          const scaleId = scale?.id || `${scale?.date || 'sem-data'}-${scale?.shift || 'sem-turno'}-${index}`;
          return (
            <ScaleCard
              key={scaleId}
              scale={scale}
              scaleId={scaleId}
              imageLibrary={imageLibrary}
              isComponentApp={isComponentApp}
              isExpanded={Boolean(expandedScaleIds[scaleId])}
              onToggleExpand={() =>
                setExpandedScaleIds((current) => ({
                  ...current,
                  [scaleId]: !current[scaleId]
                }))
              }
              onEdit={handleEdit}
              currentUser={authUser}
            />
          );
        })}
      </div>
    </section>
  );
}

function IconImage() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 14H5v-3.2l2.2-2.2 3.2 3.2 4-4L19 15.2V18Zm0-5.6-3.4-3.4-4 4-3.2-3.2L5 12.2V6h14v6.4Z" />
    </svg>
  );
}
