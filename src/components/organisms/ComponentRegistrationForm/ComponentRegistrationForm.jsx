'use client';

import { useEffect, useMemo, useState } from 'react';
import Calendar from '@/components/molecules/Calendar/Calendar';
import { useAuthSession } from '@/context/AuthSessionContext';
import { requestJson } from '@/lib/api/http';
import styles from './ComponentRegistrationForm.module.css';

function validateForm(values, options = {}) {
  const { isEditMode = false } = options;
  const nextErrors = {};

  if (!values.fullName.trim()) {
    nextErrors.fullName = 'Informe o nome completo.';
  }

  if (!values.birthDate) {
    nextErrors.birthDate = 'Selecione a data de nascimento.';
  }

  if (!values.username.trim()) {
    nextErrors.username = 'Informe o usuário.';
  }

  if (!isEditMode && !values.password.trim()) {
    nextErrors.password = 'Informe a senha.';
  }

  if (!values.permissionType || !['group-app', 'component-app'].includes(values.permissionType)) {
    nextErrors.permissionType = 'Selecione o tipo de permissao.';
  }

  return nextErrors;
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join('');
}

function toLocalIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getPhotoIndicator(photoFile) {
  if (!photoFile) {
    return '';
  }

  return photoFile.name || photoFile.type || 'foto-selecionada';
}

function normalizeLoadedComponent(payload, fallbackId) {
  const source = payload?.item && typeof payload.item === 'object' ? payload.item : payload;

  if (!source || typeof source !== 'object') {
    return null;
  }

  const permission =
    typeof source.permissionType === 'string' && ['group-app', 'component-app'].includes(source.permissionType)
      ? source.permissionType
      : '';

  return {
    id:
      (typeof source.id === 'string' && source.id.trim()) ||
      (typeof source._id === 'string' && source._id.trim()) ||
      fallbackId,
    fullName: typeof source.fullName === 'string' ? source.fullName : '',
    birthDate: typeof source.birthDate === 'string' ? source.birthDate : '',
    username: typeof source.username === 'string' ? source.username : '',
    permissionType: permission,
    photoUrl: typeof source.photoUrl === 'string' ? source.photoUrl : '',
    photoProvided: Boolean(source.photoProvided),
    isActive: source.isActive !== false
  };
}

export default function ComponentRegistrationForm({ componentId = '' }) {
  const { audience, isLoading: isAuthLoading } = useAuthSession();
  const isEditMode = Boolean(componentId);
  const canManageComponent = !isAuthLoading && audience === 'group-app';
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [permissionType, setPermissionType] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [savedPhotoUrl, setSavedPhotoUrl] = useState('');
  const [savedPhotoProvided, setSavedPhotoProvided] = useState(false);
  const [isComponentActive, setIsComponentActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingComponent, setIsFetchingComponent] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const previewFallback = useMemo(() => getInitials(fullName || 'Foto'), [fullName]);

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
    let isMounted = true;

    async function loadComponent() {
      if (!isEditMode) {
        return;
      }

      if (!canManageComponent) {
        setFeedback({
          type: 'error',
          message: 'Seu perfil nao possui permissao para editar componentes.'
        });
        return;
      }

      setIsFetchingComponent(true);
      setFeedback({ type: 'idle', message: '' });
      setErrors({});

      try {
        const responsePayload = await requestJson(`/api/components/${componentId}`);
        const loaded = normalizeLoadedComponent(responsePayload, componentId);

        if (!isMounted || !loaded) {
          return;
        }

        setFullName(loaded.fullName);
        setBirthDate(loaded.birthDate);
        setUsername(loaded.username);
        setPassword('');
        setPermissionType(loaded.permissionType);
        setPhotoFile(null);
        setSavedPhotoUrl(loaded.photoUrl);
        setSavedPhotoProvided(Boolean(loaded.photoProvided));
        setIsComponentActive(loaded.isActive);
        setShowPassword(false);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Nao foi possivel carregar os dados do componente para edicao.'
        });
      } finally {
        if (isMounted) {
          setIsFetchingComponent(false);
        }
      }
    }

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [canManageComponent, componentId, isEditMode]);

  function clearFeedback() {
    setFeedback({ type: 'idle', message: '' });
  }

  function resetForm() {
    setFullName('');
    setBirthDate('');
    setUsername('');
    setPassword('');
    setPermissionType('');
    setPhotoFile(null);
    setPhotoPreview('');
    setSavedPhotoUrl('');
    setSavedPhotoProvided(false);
    setIsComponentActive(true);
    setShowPassword(false);
    setErrors({});
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isEditMode && !canManageComponent) {
      setFeedback({
        type: 'error',
        message: 'Seu perfil nao possui permissao para editar componentes.'
      });
      return;
    }

    const nextErrors = validateForm(
      {
        fullName,
        birthDate,
        username,
        password,
        permissionType
      },
      { isEditMode }
    );

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFeedback({
        type: 'error',
        message: 'Corrija os campos destacados antes de continuar.'
      });
      return;
    }

    setIsSubmitting(true);
    clearFeedback();

    try {
      const selectedPhotoIndicator = getPhotoIndicator(photoFile);
      const payload = {
        fullName: fullName.trim(),
        birthDate: birthDate instanceof Date ? toLocalIsoDate(birthDate) : birthDate,
        username: username.trim(),
        permissionType,
        photoUrl: selectedPhotoIndicator || savedPhotoUrl,
        photoProvided: selectedPhotoIndicator ? true : savedPhotoProvided
      };

      if (!isEditMode || password.trim()) {
        payload.password = password;
      }

      const responsePayload = await requestJson(
        isEditMode ? `/api/components/${componentId}` : '/api/components',
        {
          method: isEditMode ? 'PATCH' : 'POST',
          body: payload
        }
      );

      const successMessage =
        typeof responsePayload?.message === 'string' && responsePayload.message.trim()
          ? responsePayload.message.trim()
          : isEditMode
            ? 'Componente atualizado com sucesso.'
            : 'Componente cadastrado com sucesso.';

      setFeedback({ type: 'success', message: successMessage });

      if (isEditMode) {
        if (selectedPhotoIndicator) {
          setSavedPhotoUrl(selectedPhotoIndicator);
          setSavedPhotoProvided(true);
        }
        setPassword('');
        setPhotoFile(null);
        setPhotoPreview('');
      } else {
        resetForm();
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : isEditMode
              ? 'Nao foi possivel atualizar o componente agora. Tente novamente.'
              : 'Nao foi possivel cadastrar o componente agora. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeactivate() {
    if (!isEditMode || !componentId || isDeactivating || !isComponentActive) {
      return;
    }

    const confirmed = window.confirm('Deseja inativar este componente? Essa acao pode ser revertida depois.');

    if (!confirmed) {
      return;
    }

    setIsDeactivating(true);
    clearFeedback();

    try {
      const responsePayload = await requestJson(`/api/components/${componentId}`, {
        method: 'PATCH',
        body: { isActive: false }
      });

      const successMessage =
        typeof responsePayload?.message === 'string' && responsePayload.message.trim()
          ? responsePayload.message.trim()
          : 'Componente inativado com sucesso.';

      setIsComponentActive(false);
      setFeedback({ type: 'success', message: successMessage });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Nao foi possivel inativar o componente agora.'
      });
    } finally {
      setIsDeactivating(false);
    }
  }

  function handlePhotoChange(event) {
    const nextFile = event.target.files?.[0] || null;
    clearFeedback();
    setPhotoFile(nextFile);
  }

  const todayIso = toLocalIsoDate(new Date());
  const displayedPhoto = photoPreview || savedPhotoUrl;

  return (
    <section
      className={styles.card}
      aria-label={isEditMode ? 'Formulario de edicao de componente' : 'Formulario de cadastro de componentes'}
      aria-busy={isFetchingComponent || isSubmitting || isDeactivating}
    >
      {feedback.message ? (
        <p
          className={`${styles.feedback} ${
            feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess
          }`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {feedback.message}
        </p>
      ) : null}

      {isEditMode ? (
        <p className={`${styles.modeBadge} ${isComponentActive ? styles.modeBadgeActive : styles.modeBadgeInactive}`}>
          {isComponentActive ? 'Modo edicao • componente ativo' : 'Modo edicao • componente inativo'}
        </p>
      ) : null}

      {isEditMode && !canManageComponent && !isAuthLoading ? (
        <p className={styles.permissionNotice} role="alert">
          Seu perfil nao possui permissao para editar ou inativar este componente.
        </p>
      ) : null}

      <div className={styles.photoArea}>
        <div className={styles.photoPreview}>
          {displayedPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayedPhoto}
              alt={photoPreview ? 'Preview da foto selecionada' : 'Foto atual do componente'}
              className={styles.photoImage}
            />
          ) : (
            <div className={styles.photoFallback} aria-hidden="true">
              {previewFallback || 'Foto'}
            </div>
          )}
        </div>

        <div className={styles.photoCopy}>
          <strong>Foto do componente</strong>
          <p>
            {isEditMode
              ? 'Atualize a imagem se desejar. Se nao selecionar uma nova foto, a atual sera mantida.'
              : 'Escolha uma imagem opcional para visualizar antes de enviar o cadastro.'}
          </p>

          <label className={styles.fileButton} htmlFor="component-photo">
            {isEditMode ? 'Trocar foto' : 'Selecionar foto'}
          </label>
          <input
            id="component-photo"
            className={styles.fileInput}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />

          <span className={styles.helpText}>PNG, JPG ou WebP. Opcional.</span>
        </div>
      </div>

      {isEditMode && isFetchingComponent ? (
        <p className={styles.loadingState} role="status" aria-live="polite">
          Carregando dados do componente...
        </p>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        <div className={styles.field}>
          <label htmlFor="fullName">Nome completo</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={fullName}
            onChange={(event) => {
              clearFeedback();
              setFullName(event.target.value);
            }}
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            placeholder="Digite o nome completo"
            disabled={isFetchingComponent || (isEditMode && !canManageComponent)}
          />
          {errors.fullName ? (
            <span className={styles.error} id="fullName-error" role="alert">
              {errors.fullName}
            </span>
          ) : null}
        </div>

        <Calendar
          id="birthDate"
          label="Data de nascimento"
          value={birthDate}
          onChange={(nextValue) => {
            clearFeedback();
            setBirthDate(nextValue);
          }}
          placeholder="Selecione a data (dia, mes e ano)"
          required
          error={errors.birthDate || ''}
          helperText="Selecione dia, mes e ano. No topo do calendario, ajuste a navegacao para chegar ao ano desejado."
          maxDate={todayIso}
          name="birthDate"
          disabled={isFetchingComponent || (isEditMode && !canManageComponent)}
        />

        <div className={styles.field}>
          <label htmlFor="username">Usuário</label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(event) => {
              clearFeedback();
              setUsername(event.target.value);
            }}
            autoComplete="username"
            aria-invalid={Boolean(errors.username)}
            aria-describedby={errors.username ? 'username-error' : undefined}
            placeholder="Crie um usuário"
            disabled={isFetchingComponent || (isEditMode && !canManageComponent)}
          />
          {errors.username ? (
            <span className={styles.error} id="username-error" role="alert">
              {errors.username}
            </span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Senha</label>
          <div className={styles.passwordWrap}>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => {
                clearFeedback();
                setPassword(event.target.value);
              }}
              autoComplete={isEditMode ? 'current-password' : 'new-password'}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : 'password-help'}
              placeholder={isEditMode ? 'Preencha somente para alterar a senha' : 'Digite uma senha'}
              disabled={isFetchingComponent || (isEditMode && !canManageComponent)}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword((current) => !current)}
              aria-pressed={showPassword}
              disabled={isFetchingComponent || (isEditMode && !canManageComponent)}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {isEditMode ? (
            <span className={styles.helpText} id="password-help">
              Em edicao, a senha e opcional.
            </span>
          ) : null}
          {errors.password ? (
            <span className={styles.error} id="password-error" role="alert">
              {errors.password}
            </span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="permissionType">Tipo de permissao</label>
          <select
            id="permissionType"
            name="permissionType"
            value={permissionType}
            onChange={(event) => {
              clearFeedback();
              setPermissionType(event.target.value);
            }}
            aria-invalid={Boolean(errors.permissionType)}
            aria-describedby={errors.permissionType ? 'permissionType-error' : undefined}
            required
            disabled={isFetchingComponent || (isEditMode && !canManageComponent)}
          >
            <option value="">Selecione o tipo de permissao</option>
            <option value="group-app">group-app</option>
            <option value="component-app">component-app</option>
          </select>
          {errors.permissionType ? (
            <span className={styles.error} id="permissionType-error" role="alert">
              {errors.permissionType}
            </span>
          ) : null}
        </div>

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || isFetchingComponent || isDeactivating || (isEditMode && !canManageComponent)}
          >
            {isSubmitting
              ? isEditMode
                ? 'Salvando alteracoes...'
                : 'Cadastrando...'
              : isEditMode
                ? 'Salvar alteracoes'
                : 'Cadastrar componente'}
          </button>

          {isEditMode ? (
            <button
              type="button"
              className={styles.deactivateButton}
              onClick={handleDeactivate}
              disabled={
                isSubmitting ||
                isFetchingComponent ||
                isDeactivating ||
                !isComponentActive ||
                !canManageComponent
              }
            >
              {isDeactivating ? 'Inativando...' : isComponentActive ? 'Inativar componente' : 'Componente inativo'}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
