'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import styles from './ScaleFeed.module.css';

const COMPONENTS_VIEW = 'components';
const PLAYLIST_VIEW = 'playlist';

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

function ScaleCard({ scale, onEdit }) {
  const [activeView, setActiveView] = useState(COMPONENTS_VIEW);

  return (
    <article className={styles.scaleCard}>
      <header className={styles.cardHeader}>
        <div className={styles.headerAvatar} aria-hidden="true">
          {scale.shift.slice(0, 1)}
        </div>
        <div className={styles.headerMeta}>
          <strong>{scale.date}</strong>
          <span>Turno: {scale.shift}</span>
        </div>
      </header>

      <section className={styles.cardBody}>
        {activeView === COMPONENTS_VIEW ? (
          <ComponentsPanel members={scale.members} />
        ) : (
          <PlaylistPanel playlist={scale.playlist} />
        )}
      </section>

      <footer className={styles.cardFooter}>
        <div className={styles.leftActions}>
          <button
            type="button"
            className={`${styles.actionButton} ${
              activeView === COMPONENTS_VIEW ? styles.actionButtonActive : ''
            }`}
            onClick={() => setActiveView(COMPONENTS_VIEW)}
            aria-pressed={activeView === COMPONENTS_VIEW}
          >
            Componentes
          </button>
          <button
            type="button"
            className={`${styles.actionButton} ${
              activeView === PLAYLIST_VIEW ? styles.actionButtonActive : ''
            }`}
            onClick={() => setActiveView(PLAYLIST_VIEW)}
            aria-pressed={activeView === PLAYLIST_VIEW}
          >
            Playlist
          </button>
        </div>

        <div className={styles.rightActions}>
          <button
            type="button"
            className={styles.editButton}
            onClick={() => onEdit(scale)}
            disabled={!scale.canEdit}
            aria-label={`Editar escala de ${scale.date} ${scale.shift}`}
          >
            Editar escala
          </button>
        </div>
      </footer>
    </article>
  );
}

export default function ScaleFeed({ scales }) {
  const [feedback, setFeedback] = useState('');

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
        <p>Visualize componentes e playlists em formato de feed.</p>
      </header>

      {feedback ? (
        <p className={styles.feedback} role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}

      <div className={styles.feedList}>
        {scales.map((scale) => (
          <ScaleCard key={scale.id} scale={scale} onEdit={handleEdit} />
        ))}
      </div>
    </section>
  );
}
