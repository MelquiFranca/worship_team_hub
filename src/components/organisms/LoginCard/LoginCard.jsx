'use client';

import { useRef, useState } from 'react';
import styles from './LoginCard.module.css';

function fakeAuthRequest(identifier, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (identifier.toLowerCase() === 'demo@instagram.com' && password === '123456') {
        resolve({ ok: true });
        return;
      }

      reject(new Error('Invalid credentials.'));
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

  const validateFields = () => {
    let valid = true;

    if (!identifier.trim()) {
      setIdentifierError('Enter your username, phone number or email.');
      valid = false;
    } else {
      setIdentifierError('');
    }

    if (!password.trim()) {
      setPasswordError('Enter your password.');
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
      setFormSuccess('Login successful. Redirecting...');
    } catch (error) {
      setFormError(error?.message || 'Unable to log in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.loginCard} aria-label="Account access">
      <header className={styles.brandBlock}>
        <h1 id="login-title" className={styles.brand}>
          Instagram
        </h1>
      </header>

      <form className={styles.loginForm} onSubmit={handleSubmit} noValidate>
        <div className={styles.fieldGroup}>
          <label className={styles.srOnly} htmlFor="identifier">
            Phone number, username or email address
          </label>
          <input
            ref={identifierRef}
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="Phone number, username or email address"
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
          <label className={styles.srOnly} htmlFor="password">
            Password
          </label>
          <div className={styles.passwordWrap}>
            <input
              ref={passwordRef}
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Password"
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
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-controls="password"
              aria-pressed={showPassword}
              onClick={handleTogglePassword}
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </button>
          </div>
          <p id="password-error" className={styles.errorText} aria-live="polite">
            {passwordError}
          </p>
        </div>

        <a className={styles.forgotLink} href="#" aria-label="Forgot password">
          Forgotten password?
        </a>

        <button className={styles.submitBtn} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>

        <p className={`${styles.formMessage} ${styles.formError}`} role="alert" aria-live="assertive">
          {formError}
        </p>
        <p className={`${styles.formMessage} ${styles.formSuccess}`} aria-live="polite">
          {formSuccess}
        </p>
      </form>

      <div className={styles.divider} role="separator" aria-label="or">
        <span className={styles.line} aria-hidden="true" />
        <span className={styles.or}>OR</span>
        <span className={styles.line} aria-hidden="true" />
      </div>

      <button className={styles.facebookBtn} type="button" aria-label="Log in with Facebook">
        <span className={styles.fbIcon} aria-hidden="true">
          f
        </span>
        <span>Log in with Facebook</span>
      </button>

      <footer className={styles.signupFooter}>
        <p>
          Don&apos;t have an account? <a href="#">Sign Up</a>
        </p>
      </footer>
    </section>
  );
}
