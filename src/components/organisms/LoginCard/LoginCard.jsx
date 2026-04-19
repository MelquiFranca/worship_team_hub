'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LoginCard.module.css';

const GROUP_NAME = 'Worship Team Hub';
const GROUP_PHOTO_URL = 'logo3.png';
const GROUP_INITIALS = 'MA';
const AUTH_LOGIN_ENDPOINT = '/api/auth/login';
const LOGIN_REDIRECT_DELAY_MS = 350;

async function readResponsePayload(response) {
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return { message: rawBody };
  }
}

function pickFirstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
}

function getAuthErrorMessage(payload, status, isAdminMode) {
  const rawCode = pickFirstString(
    payload?.code,
    payload?.errorCode,
    payload?.error?.code,
    payload?.error?.errorCode,
    payload?.name
  ).toUpperCase();

  const rawMessage = pickFirstString(
    payload?.message,
    payload?.error?.message,
    typeof payload?.error === 'string' ? payload.error : '',
    payload?.detail,
    payload?.error?.detail
  );
  const safeRawMessage = rawMessage.startsWith('<') || rawMessage.length > 200 ? '' : rawMessage;

  const audienceMessage = isAdminMode
    ? 'Este usuário não tem permissão para acessar o painel administrativo.'
    : 'Este usuário não tem permissão para acessar o app do grupo.';

  const codeMessages = {
    AUTH_INVALID_CREDENTIALS: 'Credenciais inválidas. Confira seu usuário e senha.',
    AUTH_LOGIN_INVALID: 'Credenciais inválidas. Confira seu usuário e senha.',
    AUTH_UNAUTHORIZED: 'Não foi possível autenticar. Verifique seus dados e tente novamente.',
    AUTH_FORBIDDEN: audienceMessage,
    AUTH_ACCESS_DENIED: audienceMessage,
    AUTH_USER_INACTIVE: 'Sua conta está inativa. Fale com o suporte.',
    AUTH_AUDIENCE_FORBIDDEN: audienceMessage,
    AUTH_ROLE_FORBIDDEN: audienceMessage,
    AUTH_RATE_LIMITED: 'Muitas tentativas de acesso. Aguarde um momento e tente novamente.'
  };

  if (rawCode && codeMessages[rawCode]) {
    return codeMessages[rawCode];
  }

  if (safeRawMessage) {
    return safeRawMessage;
  }

  if (status === 401) {
    return 'Não foi possível autenticar. Verifique seus dados e tente novamente.';
  }

  if (status === 403) {
    return audienceMessage;
  }

  if (status === 429) {
    return 'Muitas tentativas de acesso. Aguarde um momento e tente novamente.';
  }

  if (status >= 500) {
    return 'O serviço de autenticação está indisponível no momento. Tente novamente em instantes.';
  }

  return 'Não foi possível entrar. Tente novamente.';
}

async function loginWithJwt({ identifier, password, audience, isAdminMode }) {
  const response = await fetch(AUTH_LOGIN_ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      identifier,
      password,
      audience
    })
  });

  if (!response.ok) {
    const payload = await readResponsePayload(response);
    throw new Error(getAuthErrorMessage(payload, response.status, isAdminMode));
  }

  return response;
}

async function loginWithFallbackAudience({ identifier, password, isAdminMode }) {
  const primaryAudience = isAdminMode ? 'admin-panel' : 'group-app';

  try {
    await loginWithJwt({ identifier, password, audience: primaryAudience, isAdminMode });
    return;
  } catch (error) {
    if (isAdminMode) {
      throw error;
    }

    const message = String(error?.message || '').toLowerCase();
    const shouldTryComponentAudience =
      message.includes('permiss') ||
      message.includes('audiencia') ||
      message.includes('audiência') ||
      message.includes('forbidden');

    if (!shouldTryComponentAudience) {
      throw error;
    }

    await loginWithJwt({
      identifier,
      password,
      audience: 'component-app',
      isAdminMode
    });
  }
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
  const redirectTimeoutRef = useRef(null);

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

  useEffect(
    () => () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    },
    []
  );

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
      await loginWithFallbackAudience({
        identifier: identifier.trim(),
        password,
        isAdminMode
      });

      setFormSuccess(isAdminMode ? 'Acesso administrativo autorizado. Redirecionando...' : 'Login realizado com sucesso. Redirecionando...');

      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }

      redirectTimeoutRef.current = window.setTimeout(() => {
        router.replace(isAdminMode ? '/admin/grupos' : '/escalas');
      }, LOGIN_REDIRECT_DELAY_MS);
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
