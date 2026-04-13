'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './AdminMainNav.module.css';

const ADMIN_PROFILE_STORAGE_KEY = 'escalas-app:admin-profile';

function isActiveRoute(pathname, targetPath) {
  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
}

function getInitials(name) {
  return (
    String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'AD'
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M19.14 12.94c.04-.3.06-.62.06-.94s-.02-.64-.06-.94l2.03-1.58a.75.75 0 0 0 .18-.95l-1.92-3.32a.75.75 0 0 0-.9-.33l-2.39.96a7.3 7.3 0 0 0-1.63-.94l-.36-2.54A.75.75 0 0 0 13.4 2h-3.8a.75.75 0 0 0-.74.62l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.75.75 0 0 0-.9.33L1.66 9.79a.75.75 0 0 0 .18.95l2.03 1.58c-.04.3-.06.62-.06.94s.02.64.06.94l-2.03 1.58a.75.75 0 0 0-.18.95l1.92 3.32c.2.35.62.5.99.33l2.39-.96c.5.39 1.05.71 1.63.94l.36 2.54c.06.37.38.62.75.62h3.8c.37 0 .69-.25.75-.62l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.37.17.8.02.99-.33l1.92-3.32a.75.75 0 0 0-.18-.95l-2.03-1.58Zm-7.14 2.31A3.25 3.25 0 1 1 12 8.75a3.25 3.25 0 0 1 0 6.5Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M11 5.5a1 1 0 0 1 2 0V11h5.5a1 1 0 1 1 0 2H13v5.5a1 1 0 1 1-2 0V13H5.5a1 1 0 1 1 0-2H11V5.5Z" />
    </svg>
  );
}

function readAdminProfile() {
  if (typeof window === 'undefined') {
    return {
      name: 'Administrador',
      photo: ''
    };
  }

  try {
    const raw = window.sessionStorage.getItem(ADMIN_PROFILE_STORAGE_KEY);
    if (!raw) {
      return {
        name: 'Administrador',
        photo: ''
      };
    }

    const parsed = JSON.parse(raw);
    return {
      name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : 'Administrador',
      photo: typeof parsed.photo === 'string' ? parsed.photo : ''
    };
  } catch {
    return {
      name: 'Administrador',
      photo: ''
    };
  }
}

export default function AdminMainNav() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState(null);
  const [profile, setProfile] = useState({ name: 'Administrador', photo: '' });
  const navRef = useRef(null);
  const addTriggerRef = useRef(null);
  const avatarTriggerRef = useRef(null);
  const addMenuFirstItemRef = useRef(null);
  const avatarMenuFirstItemRef = useRef(null);

  const settingsActive = isActiveRoute(pathname, '/admin/configuracoes');
  const initials = useMemo(() => getInitials(profile.name), [profile.name]);

  useEffect(() => {
    setProfile(readAdminProfile());
  }, []);

  const closeMenus = useCallback((options = {}) => {
    const { focusTrigger = false } = options;
    const triggerToFocus =
      openMenu === 'add' ? addTriggerRef.current : openMenu === 'avatar' ? avatarTriggerRef.current : null;

    setOpenMenu(null);

    if (focusTrigger && triggerToFocus) {
      requestAnimationFrame(() => {
        triggerToFocus.focus();
      });
    }
  }, [openMenu]);

  useEffect(() => {
    function handlePointerDown(event) {
      const navElement = navRef.current;
      if (!navElement || navElement.contains(event.target)) {
        return;
      }

      closeMenus();
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeMenus({ focusTrigger: true });
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeMenus]);

  useEffect(() => {
    if (openMenu === 'add') {
      requestAnimationFrame(() => {
        addMenuFirstItemRef.current?.focus();
      });
    }

    if (openMenu === 'avatar') {
      requestAnimationFrame(() => {
        avatarMenuFirstItemRef.current?.focus();
      });
    }
  }, [openMenu]);

  const handleLogout = useCallback(async () => {
    setOpenMenu(null);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      // O logout real pode falhar sem impedir a saída da tela atual.
    }

    router.replace('/admin/login');
  }, [router]);

  if (pathname === '/admin/login') {
    return null;
  }

  return (
    <nav ref={navRef} className={styles.shell} aria-label="Menu principal administrativo">
      <div className={styles.inner}>
        <Link
          href="/admin/configuracoes"
          className={`${styles.item} ${settingsActive ? styles.itemActive : ''}`}
          aria-label="Configuracoes"
          aria-current={settingsActive ? 'page' : undefined}
        >
          <SettingsIcon />
          <span className={styles.srOnly}>Configuracoes</span>
        </Link>

        <div className={styles.actionSlot}>
          <button
            ref={addTriggerRef}
            type="button"
            className={`${styles.actionButton} ${openMenu === 'add' ? styles.actionButtonOpen : ''}`}
            aria-label="Abrir menu de adicionar"
            aria-expanded={openMenu === 'add'}
            aria-controls="admin-main-nav-add-menu"
            onClick={() => setOpenMenu((current) => (current === 'add' ? null : 'add'))}
          >
            <PlusIcon />
          </button>

          {openMenu === 'add' ? (
            <div id="admin-main-nav-add-menu" className={styles.popover} role="group" aria-label="Adicionar">
              <Link
                ref={addMenuFirstItemRef}
                href="/admin/grupos?novo=1"
                className={styles.popoverItem}
                onClick={() => setOpenMenu(null)}
              >
                Novo grupo
              </Link>
            </div>
          ) : null}
        </div>

        <div className={styles.avatarSlot}>
          <button
            ref={avatarTriggerRef}
            type="button"
            className={`${styles.avatarButton} ${openMenu === 'avatar' ? styles.avatarButtonOpen : ''}`}
            aria-label={`Menu do perfil ${profile.name}`}
            aria-expanded={openMenu === 'avatar'}
            aria-controls="admin-main-nav-avatar-menu"
            onClick={() => setOpenMenu((current) => (current === 'avatar' ? null : 'avatar'))}
          >
            <span className={styles.avatarFrame} aria-hidden="true">
              {profile.photo ? (
                <Image src={profile.photo} alt="" fill sizes="48px" className={styles.avatarImage} />
              ) : (
                <span className={styles.avatarFallback}>{initials}</span>
              )}
            </span>
            <span className={styles.srOnly}>Avatar do perfil logado</span>
          </button>

          {openMenu === 'avatar' ? (
            <div id="admin-main-nav-avatar-menu" className={styles.popover} role="group" aria-label="Menu do perfil">
              <Link
                ref={avatarMenuFirstItemRef}
                href="/admin/configuracoes"
                className={styles.popoverItem}
                onClick={() => setOpenMenu(null)}
              >
                Meu perfil
              </Link>
              <button type="button" className={styles.popoverItemButton} onClick={handleLogout}>
                Sair
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
