import Image from 'next/image';
import { useEffect, useId, useMemo, useState } from 'react';
import styles from './ComponentActionSheet.module.css';

export default function ComponentActionSheet({
  open,
  component,
  isSelected,
  isUnavailable,
  isEditLocked,
  isLouvorCategory,
  canTogglePlaylistPermission,
  hasPlaylistPermission,
  hasImagePermission,
  functionValue,
  functionOptions = [],
  showFunctionError,
  onChangeFunction,
  onClose,
  onToggleSelected,
  onTogglePlaylistPermission,
  onToggleImagePermission,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [dragStartY, setDragStartY] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const componentName = useMemo(() => {
    if (!component) return 'Componente';
    if (typeof component === 'string') return component;
    return component.name || component.title || component.label || 'Componente';
  }, [component]);

  const canToggleSelected = !isUnavailable && !isEditLocked;

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.root}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className={`${styles.sheet} ${isDragging ? styles.sheetDragging : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onMouseDown={(event) => event.stopPropagation()}
        style={{ transform: dragOffsetY > 0 ? `translateY(${dragOffsetY}px)` : undefined }}
      >
        <div
          className={styles.mobileHandle}
          aria-hidden="true"
          onTouchStart={(event) => {
            const touch = event.touches?.[0];
            if (!touch) {
              return;
            }
            setIsDragging(true);
            setDragStartY(touch.clientY);
          }}
          onTouchMove={(event) => {
            if (dragStartY == null) {
              return;
            }
            const touch = event.touches?.[0];
            if (!touch) {
              return;
            }
            const delta = touch.clientY - dragStartY;
            if (delta > 0) {
              setDragOffsetY(delta);
            } else {
              setDragOffsetY(0);
            }
          }}
          onTouchEnd={() => {
            const shouldClose = dragOffsetY > 110;
            setIsDragging(false);
            setDragStartY(null);
            if (shouldClose) {
              onClose?.();
              setDragOffsetY(0);
              return;
            }
            setDragOffsetY(0);
          }}
        />

        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            Acoes do componente
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Fechar menu de acoes do componente"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={styles.identityRow}>
          <div className={styles.avatarWrap} aria-hidden="true">
            {component && typeof component === 'object' && component.photo ? (
              <Image
                src={component.photo}
                alt=""
                width={72}
                height={72}
                className={styles.avatarImage}
                unoptimized
              />
            ) : (
              <span className={styles.avatarFallback}>{componentName.slice(0, 1)}</span>
            )}
          </div>
          <p id={descriptionId} className={styles.description}>
            {componentName}
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.primaryAction} ${isSelected ? styles.primaryActionRemove : ''}`}
            onClick={onToggleSelected}
            disabled={!canToggleSelected}
            aria-label={isSelected ? 'Remover componente da escala' : 'Selecionar componente na escala'}
          >
            {isSelected ? 'Remover da escala' : 'Selecionar na escala'}
          </button>

          {isSelected ? (
            <label className={`${styles.functionField} ${showFunctionError ? styles.functionFieldError : ''}`}>
              <span className={styles.functionLabel}>Funcao na escala</span>
              <select
                className={styles.functionSelect}
                value={functionValue || ''}
                onChange={(event) => onChangeFunction?.(event.target.value)}
                disabled={isEditLocked}
                aria-label="Selecionar funcao do componente na escala"
              >
                <option value="">Selecione uma funcao</option>
                {functionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {isLouvorCategory ? (
            <label className={styles.switchRow}>
              <span>Editar playlist</span>
              <input
                type="checkbox"
                checked={Boolean(hasPlaylistPermission)}
                disabled={!canTogglePlaylistPermission || isEditLocked}
                onChange={onTogglePlaylistPermission}
                aria-label="Permitir edicao de playlist"
              />
            </label>
          ) : null}

          <label className={styles.switchRow}>
            <span>Editar imagem</span>
            <input
              type="checkbox"
              checked={Boolean(hasImagePermission)}
              disabled={Boolean(isEditLocked)}
              onChange={onToggleImagePermission}
              aria-label="Permitir edicao de imagem"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
