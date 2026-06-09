'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useAppDataCache } from '@/context/AppDataCacheContext';
import { useActionFeedback } from '@/context/ToastContext';
import AppDataRefreshButton from '@/components/molecules/AppDataRefreshButton/AppDataRefreshButton';
import styles from './page.module.css';

const PHOTO_UPLOAD_MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_PHOTO_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

function getInitials(name) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'EA'
  );
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeProfile(payload) {
  const source =
    (payload?.profile && typeof payload.profile === 'object' && payload.profile) ||
    (payload?.item && typeof payload.item === 'object' && payload.item) ||
    (payload?.user && typeof payload.user === 'object' && payload.user) ||
    (payload && typeof payload === 'object' ? payload : null);

  if (!source) {
    return null;
  }

  const name = normalizeString(source.name || source.fullName || source.displayName || source.username);
  const photo = normalizeString(source.photoDataUrl || source.photo || source.photoUrl || source.avatarUrl);

  return { name, photo };
}

function validatePhotoFile(file) {
  if (!file) {
    return '';
  }

  if (!ACCEPTED_PHOTO_MIME_TYPES.has(file.type)) {
    return 'Formato de imagem invalido. Use PNG, JPG, WebP ou GIF.';
  }

  if (file.size > PHOTO_UPLOAD_MAX_SIZE_BYTES) {
    return 'A imagem deve ter no maximo 2MB.';
  }

  return '';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new Error('Nao foi possivel preparar a imagem para upload.'));
        return;
      }

      resolve(result);
    };

    reader.onerror = () => reject(new Error('Nao foi possivel ler o arquivo selecionado.'));
    reader.readAsDataURL(file);
  });
}

function validatePasswordFields({ currentPassword, newPassword, confirmPassword }) {
  const nextErrors = {};
  const currentValue = currentPassword.trim();
  const newValue = newPassword.trim();
  const confirmValue = confirmPassword.trim();
  const isChangingPassword = Boolean(currentValue || newValue || confirmValue);

  if (!isChangingPassword) {
    return nextErrors;
  }

  if (!currentValue) {
    nextErrors.currentPassword = 'Informe a senha atual para alterar a senha.';
  }

  if (!newValue) {
    nextErrors.newPassword = 'Informe a nova senha.';
  }

  if (!confirmValue) {
    nextErrors.confirmPassword = 'Confirme a nova senha.';
  }

  if (newValue && confirmValue && newValue !== confirmValue) {
    nextErrors.confirmPassword = 'A confirmacao da nova senha nao confere.';
  }

  if (currentValue && newValue && currentValue === newValue) {
    nextErrors.newPassword = 'A nova senha deve ser diferente da senha atual.';
  }

  return nextErrors;
}

export default function EditProfilePage() {
  const fileInputRef = useRef(null);
  const { isLoading: isAuthLoading, isAuthenticated, user } = useAuthSession();
  const { profile: cachedProfile, isHydrating, isRefreshing, error, refreshAppData } = useAppDataCache();
  const { showActionFeedback } = useActionFeedback();
  const [profileName, setProfileName] = useState('');
  const [savedPhoto, setSavedPhoto] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [removePhoto, setRemovePhoto] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [, setFeedback] = useState({ type: 'idle', message: '' });

  const displayName = profileName || normalizeString(user?.name || user?.fullName || user?.username) || 'Perfil';
  const previewPhoto = photoPreview || (removePhoto ? '' : savedPhoto);
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  useEffect(() => {
    if (isAuthLoading || isHydrating) {
      return;
    }

    if (!isAuthenticated) {
      setFeedback({ type: 'error', message: 'Voce precisa estar logado para editar seu perfil.' });
      setIsLoadingProfile(false);
      return;
    }

    setProfileName(cachedProfile?.name || normalizeString(user?.name || user?.fullName || user?.username) || '');
    setSavedPhoto(cachedProfile?.photo || '');
    setPhotoFile(null);
    setRemovePhoto(false);
    setFeedback({ type: 'idle', message: '' });
    setIsLoadingProfile(false);
  }, [cachedProfile?.name, cachedProfile?.photo, isAuthLoading, isAuthenticated, isHydrating, user]);

  function handlePhotoSelection(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const fileError = validatePhotoFile(file);
    if (fileError) {
      setErrors((current) => ({ ...current, photo: fileError }));
      event.target.value = '';
      return;
    }

    setErrors((current) => {
      const next = { ...current };
      delete next.photo;
      return next;
    });
    setFeedback({ type: 'idle', message: '' });
    setRemovePhoto(false);
    setPhotoFile(file);
  }

  function handleRemovePhoto() {
    setPhotoFile(null);
    setRemovePhoto(true);
    setErrors((current) => {
      const next = { ...current };
      delete next.photo;
      return next;
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {
      ...validatePasswordFields({ currentPassword, newPassword, confirmPassword }),
      ...(photoFile ? { photo: validatePhotoFile(photoFile) } : {})
    };

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key]) {
        delete nextErrors[key];
      }
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const hasPasswordChange = Boolean(currentPassword.trim() || newPassword.trim() || confirmPassword.trim());
    const hasPhotoRemoval = removePhoto && Boolean(savedPhoto);
    const hasPhotoUpload = Boolean(photoFile);
    const hasPhotoChange = hasPhotoRemoval || hasPhotoUpload;

    if (!hasPasswordChange && !hasPhotoChange) {
      setFeedback({ type: 'error', message: 'Nenhuma alteracao para salvar.' });
      showActionFeedback({ type: 'error', message: 'Nenhuma alteracao para salvar.' });
      return;
    }

    setIsSaving(true);
    setFeedback({ type: 'idle', message: '' });

    try {
      const body = {};

      if (hasPasswordChange) {
        body.currentPassword = currentPassword.trim();
        body.newPassword = newPassword.trim();
      }

      if (hasPhotoUpload) {
        body.photoDataUrl = await readFileAsDataUrl(photoFile);
        body.photoFilename = photoFile.name;
        body.photoProvided = true;
      } else if (hasPhotoRemoval) {
        body.photoDataUrl = null;
        body.photoUrl = '';
        body.photoProvided = false;
      }

      const payload = await requestJson('/api/auth/profile', {
        method: 'PATCH',
        body
      });

      const normalized = normalizeProfile(payload);
      const nextPhoto =
        normalized?.photo !== undefined
          ? normalized.photo
          : hasPhotoUpload
            ? body.photoDataUrl
            : hasPhotoRemoval
              ? ''
              : savedPhoto;

      setSavedPhoto(nextPhoto);
      setProfileName(normalized?.name || profileName);
      setPhotoFile(null);
      setRemovePhoto(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      setFeedback({ type: 'success', message: 'Perfil atualizado com sucesso.' });
      showActionFeedback({ type: 'success', message: 'Perfil atualizado com sucesso.' });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Nao foi possivel salvar as alteracoes do perfil.'
      });
      showActionFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Nao foi possivel salvar as alteracoes do perfil.'
      });
    } finally {
      setIsSaving(false);
    }
  }

  const isPageBusy = isAuthLoading || isLoadingProfile || isHydrating;

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="edit-profile-title">
        <header className={styles.header}>
          <p className={styles.kicker}>Conta do usuario</p>
          <h1 id="edit-profile-title" className={styles.title}>
            Editar perfil
          </h1>
          <p className={styles.description}>Atualize sua foto de perfil e altere sua senha com seguranca.</p>
          {error ? (
            <div className={styles.loadingNote} role="status" aria-live="polite">
              <p className={styles.feedbackError}>{error}</p>
              <AppDataRefreshButton onClick={refreshAppData} isRefreshing={isRefreshing} label="Atualizar" compact />
            </div>
          ) : null}
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.photoColumn}>
            <div className={styles.avatar} aria-label="Preview da foto do perfil">
              {previewPhoto ? (
                <Image
                  src={previewPhoto}
                  alt={`Foto de perfil de ${displayName}`}
                  fill
                  sizes="112px"
                  className={styles.avatarImage}
                  unoptimized
                />
              ) : (
                <span className={styles.avatarFallback}>{initials}</span>
              )}
            </div>
            <div className={styles.photoActions}>
              <label className={styles.uploadButton}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handlePhotoSelection}
                  disabled={isPageBusy || isSaving}
                />
                Escolher foto
              </label>
              <button
                type="button"
                className={styles.removePhotoButton}
                onClick={handleRemovePhoto}
                disabled={isPageBusy || isSaving || (!savedPhoto && !photoFile)}
              >
                Remover foto
              </button>
            </div>
            <p className={styles.photoHint}>Formatos aceitos: PNG, JPG, WebP ou GIF. Tamanho maximo: 2MB.</p>
            {errors.photo ? <p className={styles.fieldError}>{errors.photo}</p> : null}
          </div>

          <div className={styles.fieldsColumn}>
            <div className={styles.readonlyBlock}>
              <span className={styles.readonlyLabel}>Nome</span>
              <strong className={styles.readonlyValue}>{displayName}</strong>
            </div>

            <div className={styles.field}>
              <label htmlFor="current-password">Senha atual</label>
              <input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                disabled={isPageBusy || isSaving}
              />
              {errors.currentPassword ? <p className={styles.fieldError}>{errors.currentPassword}</p> : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="new-password">Nova senha</label>
              <input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={isPageBusy || isSaving}
              />
              {errors.newPassword ? <p className={styles.fieldError}>{errors.newPassword}</p> : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="confirm-new-password">Confirmar nova senha</label>
              <input
                id="confirm-new-password"
                name="confirmNewPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={isPageBusy || isSaving}
              />
              {errors.confirmPassword ? <p className={styles.fieldError}>{errors.confirmPassword}</p> : null}
            </div>

            <button type="submit" className={styles.submitButton} disabled={isPageBusy || isSaving}>
              {isPageBusy ? 'Carregando perfil...' : isSaving ? 'Salvando...' : 'Salvar alteracoes'}
            </button>
          </div>
        </form>

        {isPageBusy ? <p className={styles.loadingNote}>Carregando dados do perfil...</p> : null}
      </section>
    </main>
  );
}
