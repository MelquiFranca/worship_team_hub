'use client';

import { useEffect, useRef, useState } from 'react';
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

export default function LoginCard() {
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
      setIdentifierError('Informe seu e-mail, telefone ou usuário.');
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
      setFormSuccess('Login realizado com sucesso. Redirecionando...');
    } catch (error) {
      setFormError(error?.message || 'Não foi possível entrar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.loginCard} aria-labelledby="login-title">
      <header className={styles.brandBlock}>
        <div className={styles.groupIdentity}>
          <div className={styles.avatar} role="img" aria-label={`Foto do grupo ${GROUP_NAME}`}>
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
            <p className={styles.kicker}>Acesso ao grupo</p>
            <h1 id="login-title" className={styles.brand}>
              {GROUP_NAME}
            </h1>
            <p className={styles.supportingCopy}>
              Entre para acessar escalas, comunicados e informações do ministério.
            </p>
          </div>
        </div>
      </header>

      <form className={styles.loginForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="identifier">
            E-mail, telefone ou usuário
          </label>
          <input
            ref={identifierRef}
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="Digite seu e-mail, telefone ou usuário"
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
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>

        <p className={`${styles.formMessage} ${styles.formError}`} role="alert" aria-live="assertive">
          {formError}
        </p>
        <p className={`${styles.formMessage} ${styles.formSuccess}`} aria-live="polite">
          {formSuccess}
        </p>
      </form>

      <div className={styles.divider} role="separator" aria-label="ou">
        <span className={styles.line} aria-hidden="true" />
        <span className={styles.or}>OU</span>
        <span className={styles.line} aria-hidden="true" />
      </div>

      <button className={styles.facebookBtn} type="button" aria-label="Entrar com o Facebook">
        <span className={styles.fbIcon} aria-hidden="true">
          f
        </span>
        <span>Entrar com o Facebook</span>
      </button>

      <footer className={styles.signupFooter}>
        <p>
          Não tem uma conta? <a href="#">Cadastre-se</a>
        </p>
      </footer>
    </section>
  );
}
