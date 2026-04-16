'use client';

import { useEffect, useMemo, useState } from 'react';
import Calendar from '@/components/molecules/Calendar/Calendar';
import { requestJson } from '@/lib/api/http';
import styles from './ComponentRegistrationForm.module.css';

function validateForm(values) {
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

function getPhotoIndicator(photoFile) {
  if (!photoFile) {
    return '';
  }

  return photoFile.name || photoFile.type || 'foto-selecionada';
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
  const [feedback, setFeedback] = useState({ type: 'idle', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function clearFeedback() {
    setFeedback({ type: 'idle', message: '' });
  }

  function resetForm() {
    setFullName('');
    setBirthDate('');
    setUsername('');
    setPassword('');
    setPhotoFile(null);
    setPhotoPreview('');
    setShowPassword(false);
    setErrors({});
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm({
      fullName,
      birthDate,
      username,
      password
    });

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
      const payload = {
        fullName: fullName.trim(),
        birthDate: birthDate instanceof Date ? toLocalIsoDate(birthDate) : birthDate,
        username: username.trim(),
        password,
        photoUrl: getPhotoIndicator(photoFile),
        photoProvided: Boolean(photoFile)
      };
      const responsePayload = await requestJson('/api/components', {
        method: 'POST',
        body: payload
      });

      const successMessage =
        typeof responsePayload?.message === 'string' && responsePayload.message.trim()
          ? responsePayload.message.trim()
          : 'Componente cadastrado com sucesso.';

      setFeedback({ type: 'success', message: successMessage });
      resetForm();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Nao foi possivel cadastrar o componente agora. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePhotoChange(event) {
    const nextFile = event.target.files?.[0] || null;
    clearFeedback();
    setPhotoFile(nextFile);
  }

  const todayIso = toLocalIsoDate(new Date());

  return (
    <section className={styles.card} aria-label="Formulario de cadastro de componentes">
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
          <p>Escolha uma imagem opcional para visualizar antes de enviar o cadastro.</p>

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

          <span className={styles.helpText}>PNG, JPG ou WebP. Opcional.</span>
        </div>
      </div>

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

        <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar componente'}
        </button>
      </form>
    </section>
  );
}
