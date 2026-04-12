'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import styles from './ScaleFeed.module.css';

const COMPONENTS_VIEW = 'components';
const PLAYLIST_VIEW = 'playlist';
const COMMENTS_VIEW = 'comments';
const MESSAGE_TYPE_TEXT = 'text';
const CURRENT_USER_ID = 'current-user';

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

function MemberRow({ member, leader = false }) {
  return (
    <article className={`${styles.memberRow} ${leader ? styles.memberLeader : ''}`}>
      <Image
        className={styles.memberPhoto}
        src={member.photo}
        alt={`Foto de ${member.name}`}
        width={40}
        height={40}
      />
      <div className={styles.memberInfo}>
        <strong>{member.name}</strong>
        <span>{member.role}</span>
      </div>
      {leader ? <span className={styles.leaderBadge}>Lider</span> : null}
    </article>
  );
}

function ComponentsPanel({ members }) {
  const { leader, groupedByRole } = useMemo(() => groupMembers(members), [members]);

  if (!members.length) {
    return <p className={styles.emptyState}>Nenhum componente escalado para esta data.</p>;
  }

  return (
    <div className={styles.componentsPanel}>
      {leader ? (
        <section className={styles.roleSection} aria-label="Lider da escala">
          <h3>Lideranca</h3>
          <MemberRow member={leader} leader />
        </section>
      ) : null}

      {groupedByRole.map((group) => (
        <section className={styles.roleSection} key={group.role} aria-label={`Funcao ${group.role}`}>
          <h3>{group.role}</h3>
          {group.members.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </section>
      ))}
    </div>
  );
}

function PlaylistPanel({ playlist }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!playlist.length) {
    return <p className={styles.emptyState}>Nenhum video disponivel nesta playlist.</p>;
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

function ScaleCard({ scale, scaleId, isExpanded, onToggleExpand, onEdit }) {
  const [activeView, setActiveView] = useState(COMPONENTS_VIEW);
  const [notifyFeedback, setNotifyFeedback] = useState('');
  const scaleDate = scale?.date || 'Data nao informada';
  const scaleShift = scale?.shift || 'Turno nao informado';
  const detailsId = `scale-card-${makeDomId(scale?.id || `${scaleDate}-${scaleShift}`)}-details`;

  const handleNotify = () => {
    setNotifyFeedback(`Notificacao enviada para ${scaleDate} (${scaleShift}).`);
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
          {activeView === COMPONENTS_VIEW ? <ComponentsPanel members={scale.members} /> : null}
          {activeView === PLAYLIST_VIEW ? <PlaylistPanel playlist={scale.playlist} /> : null}
          {activeView === COMMENTS_VIEW ? (
            <CommentsPanel scaleId={scaleId} initialMessages={scale.messages} />
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
          </div>

          <div className={styles.rightActions}>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.notifyButton}`}
              onClick={handleNotify}
              aria-label={`Notificar equipe da escala de ${scaleDate} (${scaleShift})`}
              title="Notificar"
            >
              <IconBell />
            </button>
            <button
              type="button"
              className={`${styles.iconButton} ${styles.editButton}`}
              onClick={() => onEdit(scale)}
              disabled={!scale.canEdit}
              aria-label={`Editar escala de ${scaleDate} ${scaleShift}`}
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
      </div>
    </article>
  );
}

export default function ScaleFeed({ scales }) {
  const [feedback, setFeedback] = useState('');
  const [expandedScaleIds, setExpandedScaleIds] = useState({});

  const handleEdit = (scale) => {
    if (!scale.canEdit) {
      setFeedback(`Voce nao possui permissao para editar a escala de ${scale.date} (${scale.shift}).`);
      return;
    }

    setFeedback(`Acao de edicao disparada para ${scale.date} (${scale.shift}).`);
  };

  return (
    <section className={styles.feedPage} aria-label="Feed de escalas">
      <header className={styles.feedHeader}>
        <h1>Escalas</h1>
        <p>Visualize componentes, playlists e comentarios em formato de feed.</p>
      </header>

      {feedback ? (
        <p className={styles.feedback} role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}

      <div className={styles.feedList}>
        {scales.map((scale, index) => {
          const scaleId = scale?.id || `${scale?.date || 'sem-data'}-${scale?.shift || 'sem-turno'}-${index}`;
          return (
            <ScaleCard
              key={scaleId}
              scale={scale}
              scaleId={scaleId}
              isExpanded={Boolean(expandedScaleIds[scaleId])}
              onToggleExpand={() =>
                setExpandedScaleIds((current) => ({
                  ...current,
                  [scaleId]: !current[scaleId]
                }))
              }
              onEdit={handleEdit}
            />
          );
        })}
      </div>
    </section>
  );
}
