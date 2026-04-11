'use client';

import { useEffect, useMemo, useState } from 'react';
import Calendar from '@/components/molecules/Calendar/Calendar';
import styles from './ComponentRegistrationForm.module.css';

function validateForm(values) {
  const nextErrors = {};

  if (!values.photoFile) {
    nextErrors.photo = 'Adicione uma foto.';
  }

  if (!values.fullName.trim()) {
    nextErrors.fullName = 'Informe o nome completo.';
  }

  if (!values.birthDate) {
    nextErrors.birthDate = 'Selecione a data de nascimento.';
  }

  if (!values.username.trim()) {
    nextErrors.username = 'Informe o usuário.';
  }

  if (!values.password.trim()) {
    nextErrors.password = 'Informe a senha.';
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

export default function ComponentRegistrationForm() {
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState('');

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

  function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm({
      fullName,
      birthDate,
      username,
      password,
      photoFile
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatusMessage('');
      return;
    }

    setStatusMessage('Componente preparado para cadastro com sucesso.');
  }

  function clearStatusMessage() {
    if (statusMessage) {
      setStatusMessage('');
    }
  }

  function handlePhotoChange(event) {
    const nextFile = event.target.files?.[0] || null;
    clearStatusMessage();
    setPhotoFile(nextFile);

    if (errors.photo) {
      setErrors((current) => {
        const nextErrors = { ...current };
        delete nextErrors.photo;
        return nextErrors;
      });
    }
  }

  const todayIso = toLocalIsoDate(new Date());

  return (
    <section className={styles.card} aria-label="Formulario de cadastro de componentes">
      {statusMessage ? (
        <p className={styles.feedback} role="status" aria-live="polite">
          {statusMessage}
        </p>
      ) : null}

      <div className={styles.photoArea}>
        <div className={styles.photoPreview}>
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Preview da foto selecionada" className={styles.photoImage} />
          ) : (
            <div className={styles.photoFallback} aria-hidden="true">
              {previewFallback || 'Foto'}
            </div>
          )}
        </div>

        <div className={styles.photoCopy}>
          <strong>Foto do componente</strong>
          <p>Escolha uma imagem para visualizar antes de enviar o cadastro.</p>

          <label className={styles.fileButton} htmlFor="component-photo">
            Selecionar foto
          </label>
          <input
            id="component-photo"
            className={styles.fileInput}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />

          {errors.photo ? (
            <span className={styles.error} role="alert">
              {errors.photo}
            </span>
          ) : (
            <span className={styles.helpText}>PNG, JPG ou WebP.</span>
          )}
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="fullName">Nome completo</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={fullName}
            onChange={(event) => {
              clearStatusMessage();
              setFullName(event.target.value);
            }}
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            placeholder="Digite o nome completo"
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
            clearStatusMessage();
            setBirthDate(nextValue);
          }}
          placeholder="Selecione a data"
          required
          error={errors.birthDate || ''}
          helperText="Use o calendário para escolher a data."
          maxDate={todayIso}
          name="birthDate"
        />

        <div className={styles.field}>
          <label htmlFor="username">Usuário</label>
          <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(event) => {
            clearStatusMessage();
            setUsername(event.target.value);
          }}
          autoComplete="username"
          aria-invalid={Boolean(errors.username)}
          aria-describedby={errors.username ? 'username-error' : undefined}
            placeholder="Crie um usuário"
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
                clearStatusMessage();
                setPassword(event.target.value);
              }}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              placeholder="Digite uma senha"
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword((current) => !current)}
              aria-pressed={showPassword}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {errors.password ? (
            <span className={styles.error} id="password-error" role="alert">
              {errors.password}
            </span>
          ) : null}
        </div>

        <button type="submit" className={styles.submitButton}>
          Cadastrar componente
        </button>
      </form>
    </section>
  );
}
