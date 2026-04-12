'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LoginCard.module.css';

const GROUP_NAME = 'Ministério de Louvor Avivah';
const GROUP_PHOTO_URL = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=320&q=80';
const GROUP_INITIALS = 'MA';

function fakeAuthRequest(identifier, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (identifier.toLowerCase() === 'avivah@ministerio.com' && password === '123456') {
        resolve({ ok: true });
        return;
      }

      reject(new Error('Credenciais inválidas.'));
    }, 1100);
  });
}

export default function LoginCard({ mode = 'group' }) {
  const router = useRouter();
  const isAdminMode = mode === 'admin';
  const identifierRef = useRef(null);
  const passwordRef = useRef(null);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPhotoError, setHasPhotoError] = useState(false);
  const [isPhotoLoaded, setIsPhotoLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (!GROUP_PHOTO_URL) {
      setHasPhotoError(true);
      return undefined;
    }

    const preloadedImage = new window.Image();

    preloadedImage.onload = () => {
      if (isActive) {
        setIsPhotoLoaded(true);
      }
    };

    preloadedImage.onerror = () => {
      if (isActive) {
        setHasPhotoError(true);
      }
    };

    preloadedImage.src = GROUP_PHOTO_URL;

    return () => {
      isActive = false;
    };
  }, []);

  const validateFields = () => {
    let valid = true;

    if (!identifier.trim()) {
      setIdentifierError(
        isAdminMode ? 'Informe seu usuário administrativo, e-mail ou telefone.' : 'Informe seu e-mail, telefone ou usuário.'
      );
      valid = false;
    } else {
      setIdentifierError('');
    }

    if (!password.trim()) {
      setPasswordError('Informe sua senha.');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const handleTogglePassword = () => {
    const input = passwordRef.current;
    const selectionStart = input?.selectionStart ?? null;
    const selectionEnd = input?.selectionEnd ?? null;

    setShowPassword((prev) => !prev);

    requestAnimationFrame(() => {
      if (!input) {
        return;
      }

      input.focus();

      if (selectionStart !== null && selectionEnd !== null) {
        input.setSelectionRange(selectionStart, selectionEnd);
      }
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setFormError('');
    setFormSuccess('');

    const valid = validateFields();
    if (!valid) {
      if (!identifier.trim()) {
        identifierRef.current?.focus();
      } else {
        passwordRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      await fakeAuthRequest(identifier.trim(), password);

      if (isAdminMode) {
        setFormSuccess('Acesso administrativo autorizado. Redirecionando...');
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('escalas-app:mock-admin-auth-state', 'logged-in');
          window.sessionStorage.setItem('escalas-app:mock-admin-auth-at', new Date().toISOString());
        }

        setTimeout(() => {
          router.replace('/admin/grupos');
        }, 350);
        return;
      }

      setFormSuccess('Login realizado com sucesso. Redirecionando...');
    } catch (error) {
      setFormError(error?.message || 'Não foi possível entrar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const kicker = isAdminMode ? 'Acesso administrativo' : 'Acesso ao grupo';
  const title = isAdminMode ? 'Painel administrativo' : GROUP_NAME;
  const supportingCopy = isAdminMode
    ? 'Entre para administrar grupos, escalas e configurações do sistema.'
    : 'Entre para acessar escalas, comunicados e informações do ministério.';
  const avatarLabel = isAdminMode ? 'Identidade do acesso administrativo' : `Foto do grupo ${GROUP_NAME}`;
  const identifierLabel = isAdminMode ? 'Usuário administrativo, e-mail ou telefone' : 'E-mail, telefone ou usuário';
  const identifierPlaceholder = isAdminMode
    ? 'Digite seu usuário administrativo, e-mail ou telefone'
    : 'Digite seu e-mail, telefone ou usuário';

  return (
    <section className={styles.loginCard} aria-labelledby="login-title">
      <header className={styles.brandBlock}>
        <div className={styles.groupIdentity}>
          <div className={styles.avatar} role="img" aria-label={avatarLabel}>
            {!hasPhotoError && isPhotoLoaded ? (
              <span
                className={styles.avatarImage}
                style={{ backgroundImage: `url(${GROUP_PHOTO_URL})` }}
                aria-hidden="true"
              />
            ) : (
              <span className={styles.avatarFallback} aria-hidden="true">
                {GROUP_INITIALS}
              </span>
            )}
          </div>

          <div className={styles.brandCopy}>
            <p className={styles.kicker}>{kicker}</p>
            <h1 id="login-title" className={styles.brand}>
              {title}
            </h1>
            <p className={styles.supportingCopy}>{supportingCopy}</p>
          </div>
        </div>
      </header>

      <form className={styles.loginForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="identifier">
            {identifierLabel}
          </label>
          <input
            ref={identifierRef}
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder={identifierPlaceholder}
            value={identifier}
            onChange={(event) => {
              const nextValue = event.target.value;
              setIdentifier(nextValue);
              if (identifierError && nextValue.trim()) {
                setIdentifierError('');
              }
            }}
            className={identifierError ? styles.invalid : ''}
            aria-describedby="identifier-error"
            aria-invalid={Boolean(identifierError)}
          />
          <p id="identifier-error" className={styles.errorText} aria-live="polite">
            {identifierError}
          </p>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="password">
            Senha
          </label>
          <div className={styles.passwordWrap}>
            <input
              ref={passwordRef}
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(event) => {
                const nextValue = event.target.value;
                setPassword(nextValue);
                if (passwordError && nextValue.trim()) {
                  setPasswordError('');
                }
              }}
              className={passwordError ? styles.invalid : ''}
              aria-describedby="password-error"
              aria-invalid={Boolean(passwordError)}
            />
            <button
              type="button"
              className={styles.togglePassword}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-controls="password"
              aria-pressed={showPassword}
              onClick={handleTogglePassword}
            >
              {showPassword ? 'OCULTAR' : 'MOSTRAR'}
            </button>
          </div>
          <p id="password-error" className={styles.errorText} aria-live="polite">
            {passwordError}
          </p>
        </div>

        <a className={styles.forgotLink} href="#" aria-label="Recuperar senha">
          Esqueceu a senha?
        </a>

        <button className={styles.submitBtn} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : isAdminMode ? 'Entrar no painel' : 'Entrar'}
        </button>

        <p className={`${styles.formMessage} ${styles.formError}`} role="alert" aria-live="assertive">
          {formError}
        </p>
        <p className={`${styles.formMessage} ${styles.formSuccess}`} aria-live="polite">
          {formSuccess}
        </p>
      </form>
    </section>
  );
}
