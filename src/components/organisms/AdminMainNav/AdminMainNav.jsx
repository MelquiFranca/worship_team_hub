'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthSession } from '@/context/AuthSessionContext';
import { CLIENT_AUTH_STORAGE_KEYS } from '@/lib/auth/clientSessionCleanup';
import styles from './AdminMainNav.module.css';

const ADMIN_PROFILE_STORAGE_KEY = CLIENT_AUTH_STORAGE_KEYS.adminProfile;

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

function GroupsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M15.5 11a3.5 3.5 0 1 0-2.87-5.5A4.5 4.5 0 0 1 15.5 11ZM8.5 11A3.5 3.5 0 1 0 5 7.5 3.5 3.5 0 0 0 8.5 11Zm0 1.5C5.46 12.5 3 14.69 3 17.4c0 .33.27.6.6.6h9.8a.6.6 0 0 0 .6-.6c0-2.71-2.46-4.9-5.5-4.9Zm7 0c-.95 0-1.85.2-2.66.56 1.36.96 2.25 2.32 2.52 3.94h5.04a.6.6 0 0 0 .6-.6c0-2.15-1.96-3.9-4.5-3.9Z" />
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
  const { logout } = useAuthSession();
  const [openMenu, setOpenMenu] = useState(null);
  const [profile, setProfile] = useState({ name: 'Administrador', photo: '' });
  const navRef = useRef(null);
  const addTriggerRef = useRef(null);
  const avatarTriggerRef = useRef(null);
  const addMenuFirstItemRef = useRef(null);
  const avatarMenuFirstItemRef = useRef(null);

  const groupsActive = isActiveRoute(pathname, '/admin/grupos');
  const profileActive = isActiveRoute(pathname, '/admin/configuracoes');
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
    await logout();
    router.replace('/admin/login');
  }, [logout, router]);

  if (pathname === '/admin/login') {
    return null;
  }

  return (
    <nav ref={navRef} className={styles.shell} aria-label="Menu principal administrativo">
      <div className={styles.inner}>
        <Link
          href="/admin/grupos"
          className={`${styles.item} ${groupsActive ? styles.itemActive : ''}`}
          aria-label="Grupos"
          aria-current={groupsActive ? 'page' : undefined}
        >
          <GroupsIcon />
          <span className={styles.srOnly}>Grupos</span>
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
                href="/admin/grupos/novo"
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
            <span className={`${styles.avatarFrame} ${profileActive ? styles.avatarFrameActive : ''}`} aria-hidden="true">
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
