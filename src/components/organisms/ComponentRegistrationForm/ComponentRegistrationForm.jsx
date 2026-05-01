'use client';

import { useEffect, useMemo, useState } from 'react';
import Calendar from '@/components/molecules/Calendar/Calendar';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useActionFeedback } from '@/context/ToastContext';
import { requestJson } from '@/lib/api/http';
import styles from './ComponentRegistrationForm.module.css';

const PHOTO_UPLOAD_MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_PHOTO_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const DEFAULT_PERMISSION_TYPE = 'component-app';

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

  if (!Array.isArray(values.categoryTagIds) || values.categoryTagIds.length === 0) {
    nextErrors.categoryTagIds = 'Selecione ao menos uma categoria.';
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

function normalizePhotoValue(value) {
  return typeof value === 'string' ? value : '';
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

function formatPushTargetsForInput(value) {
  if (!Array.isArray(value)) {
    return '';
  }

  return value
    .filter((entry) => typeof entry === 'string' && entry.trim())
    .map((entry) => entry.trim())
    .join('\n');
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
    photoUrl: normalizePhotoValue(source.photoUrl),
    photoDataUrl: normalizePhotoValue(source.photoDataUrl),
    photoProvided: Boolean(source.photoProvided),
    categoryTagIds: Array.isArray(source.categoryTagIds)
      ? source.categoryTagIds.filter((entry) => typeof entry === 'string' && entry.trim())
      : [],
    isActive: source.isActive !== false,
    pushTargets: Array.isArray(source.pushTargets) ? source.pushTargets : []
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
  const [permissionType, setPermissionType] = useState(DEFAULT_PERMISSION_TYPE);
  const [categoryTags, setCategoryTags] = useState([]);
  const [categoryTagIds, setCategoryTagIds] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [savedPhotoDataUrl, setSavedPhotoDataUrl] = useState('');
  const [savedPhotoUrl, setSavedPhotoUrl] = useState('');
  const [savedPhotoProvided, setSavedPhotoProvided] = useState(false);
  const [pushTargetsInput, setPushTargetsInput] = useState('');
  const [isComponentActive, setIsComponentActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [, setFeedback] = useState({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingComponent, setIsFetchingComponent] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const { showActionFeedback } = useActionFeedback();

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

    async function loadCategoryTags() {
      try {
        const payload = await requestJson('/api/group-settings');
        const tags = Array.isArray(payload?.item?.categoryTags) ? payload.item.categoryTags : [];
        if (!isMounted) {
          return;
        }
        setCategoryTags(tags);
        setCategoryTagIds((current) => (current.length ? current : tags.map((tag) => tag.id)));
      } catch {
        if (isMounted) {
          setCategoryTags([]);
        }
      }
    }

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
        setCategoryTagIds(
          loaded.categoryTagIds.length
            ? loaded.categoryTagIds
            : []
        );
        setPhotoFile(null);
        setSavedPhotoDataUrl(loaded.photoDataUrl);
        setSavedPhotoUrl(loaded.photoUrl);
        setSavedPhotoProvided(Boolean(loaded.photoProvided));
        setPushTargetsInput(formatPushTargetsForInput(loaded.pushTargets));
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

    loadCategoryTags();
    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [canManageComponent, componentId, isEditMode]);

  useEffect(() => {
    if (categoryTagIds.length === 0 && categoryTags.length > 0) {
      setCategoryTagIds(categoryTags.map((tag) => tag.id));
    }
  }, [categoryTagIds.length, categoryTags]);

  function clearFeedback() {
    setFeedback({ type: 'idle', message: '' });
  }

  function resetForm() {
    setFullName('');
    setBirthDate('');
    setUsername('');
    setPassword('');
    setPermissionType(DEFAULT_PERMISSION_TYPE);
    setCategoryTagIds(categoryTags.map((tag) => tag.id));
    setPhotoFile(null);
    setPhotoPreview('');
    setSavedPhotoDataUrl('');
    setSavedPhotoUrl('');
    setSavedPhotoProvided(false);
    setPushTargetsInput('');
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
        permissionType,
        categoryTagIds
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
      let nextPhotoDataUrl = '';

      if (photoFile) {
        nextPhotoDataUrl = await readFileAsDataUrl(photoFile);
      }

      const payload = {
        fullName: fullName.trim(),
        birthDate: birthDate instanceof Date ? toLocalIsoDate(birthDate) : birthDate,
        username: username.trim(),
        permissionType,
        categoryTagIds,
        photoUrl: savedPhotoUrl,
        photoProvided: nextPhotoDataUrl ? true : savedPhotoProvided,
        pushTargets: pushTargetsInput
      };

      if (nextPhotoDataUrl) {
        payload.photoDataUrl = nextPhotoDataUrl;
      }

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
      showActionFeedback({ type: 'success', message: successMessage });

      const updatedItem = responsePayload?.item && typeof responsePayload.item === 'object' ? responsePayload.item : null;
      const returnedPhotoDataUrl = normalizePhotoValue(updatedItem?.photoDataUrl);
      const returnedPhotoUrl = normalizePhotoValue(updatedItem?.photoUrl);
      const returnedPhotoProvided =
        typeof updatedItem?.photoProvided === 'boolean'
          ? updatedItem.photoProvided
          : Boolean(returnedPhotoDataUrl || returnedPhotoUrl);

      if (isEditMode) {
        setSavedPhotoDataUrl(returnedPhotoDataUrl || nextPhotoDataUrl || savedPhotoDataUrl);
        setSavedPhotoUrl(returnedPhotoUrl || savedPhotoUrl);
        setSavedPhotoProvided(returnedPhotoProvided);
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
      showActionFeedback({
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
      showActionFeedback({ type: 'success', message: successMessage });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Nao foi possivel inativar o componente agora.'
      });
      showActionFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Nao foi possivel inativar o componente agora.'
      });
    } finally {
      setIsDeactivating(false);
    }
  }

  function handlePhotoChange(event) {
    const nextFile = event.target.files?.[0] || null;
    const validationMessage = validatePhotoFile(nextFile);

    if (validationMessage) {
      setFeedback({ type: 'error', message: validationMessage });
      setPhotoFile(null);
      event.target.value = '';
      return;
    }

    clearFeedback();
    setPhotoFile(nextFile);
  }

  const todayIso = toLocalIsoDate(new Date());
  const displayedPhoto = photoPreview || savedPhotoDataUrl || savedPhotoUrl;

  return (
    <section
      className={styles.card}
      aria-label={isEditMode ? 'Formulario de edicao de componente' : 'Formulario de cadastro de componentes'}
      aria-busy={isFetchingComponent || isSubmitting || isDeactivating}
    >
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

          <span className={styles.helpText}>PNG, JPG, GIF ou WebP. Maximo de 2MB. Opcional.</span>
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
          <label htmlFor="pushTargets">Destinos push</label>
          <textarea
            id="pushTargets"
            name="pushTargets"
            value={pushTargetsInput}
            onChange={(event) => {
              clearFeedback();
              setPushTargetsInput(event.target.value);
            }}
            placeholder="Um token por linha (ou separado por virgula)"
            rows={4}
            disabled={isFetchingComponent || (isEditMode && !canManageComponent)}
          />
          <span className={styles.helpText}>
            Opcional. Informe os tokens/subscriptions de push do componente para melhorar a entrega das notificacoes.
          </span>
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
            <option value="component-app">Componente</option>
            <option value="group-app">Organizador</option>
          </select>
          {errors.permissionType ? (
            <span className={styles.error} id="permissionType-error" role="alert">
              {errors.permissionType}
            </span>
          ) : null}
        </div>

        <div className={styles.field}>
          <label>Categorias</label>
          <div className={styles.categoryChecks}>
            {categoryTags.map((tag) => {
              const checked = categoryTagIds.includes(tag.id);
              return (
                <label key={tag.id} className={styles.categoryCheck}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      clearFeedback();
                      setCategoryTagIds((current) => {
                        if (current.includes(tag.id)) {
                          return current.filter((id) => id !== tag.id);
                        }
                        return [...current, tag.id];
                      });
                    }}
                    disabled={isFetchingComponent || (isEditMode && !canManageComponent)}
                  />
                  <span>{tag.label}</span>
                </label>
              );
            })}
          </div>
          {errors.categoryTagIds ? (
            <span className={styles.error} role="alert">
              {errors.categoryTagIds}
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
