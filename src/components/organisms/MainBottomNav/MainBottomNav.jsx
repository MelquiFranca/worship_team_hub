'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useGroupSettings } from '@/context/GroupSettingsContext';
import styles from './MainBottomNav.module.css';

function getInitials(name) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'EA'
  );
}

function isActiveRoute(pathname, targetPath) {
  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 11.5 12 5l8 6.5v7.25A1.25 1.25 0 0 1 18.75 20H15v-5.25A1.75 1.75 0 0 0 13.25 13h-2.5A1.75 1.75 0 0 0 9 14.75V20H5.25A1.25 1.25 0 0 1 4 18.75V11.5Z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="6" height="6" rx="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" />
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

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M19.14 12.94c.04-.3.06-.62.06-.94s-.02-.64-.06-.94l2.03-1.58a.75.75 0 0 0 .18-.95l-1.92-3.32a.75.75 0 0 0-.9-.33l-2.39.96a7.3 7.3 0 0 0-1.63-.94l-.36-2.54A.75.75 0 0 0 13.4 2h-3.8a.75.75 0 0 0-.74.62l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.75.75 0 0 0-.9.33L1.66 9.79a.75.75 0 0 0 .18.95l2.03 1.58c-.04.3-.06.62-.06.94s.02.64.06.94l-2.03 1.58a.75.75 0 0 0-.18.95l1.92 3.32c.2.35.62.5.99.33l2.39-.96c.5.39 1.05.71 1.63.94l.36 2.54c.06.37.38.62.75.62h3.8c.37 0 .69-.25.75-.62l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.37.17.8.02.99-.33l1.92-3.32a.75.75 0 0 0-.18-.95l-2.03-1.58Zm-7.14 2.31A3.25 3.25 0 1 1 12 8.75a3.25 3.25 0 0 1 0 6.5Z" />
    </svg>
  );
}

export default function MainBottomNav() {
  const pathname = usePathname();
  const currentPathname = pathname || '';
  const router = useRouter();
  const { settings } = useGroupSettings();
  const { audience, permissions, isLoading: isAuthSessionLoading } = useAuthSession();
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null);
  const createMenuFirstItemRef = useRef(null);
  const avatarMenuFirstItemRef = useRef(null);
  const createTriggerRef = useRef(null);
  const avatarTriggerRef = useRef(null);

  const initials = useMemo(() => getInitials(settings.name || ''), [settings.name]);
  const canShowCreateMenu = !isAuthSessionLoading && Boolean(permissions.canInsertScale);
  const canShowSettingsLink = !isAuthSessionLoading && audience === 'group-app';
  const escalasActive = isActiveRoute(currentPathname, '/escalas');
  const componentesActive = isActiveRoute(currentPathname, '/componentes');
  const configuracoesActive = isActiveRoute(currentPathname, '/configuracoes-gerais-grupo');

  const closeMenus = useCallback((options = {}) => {
    const { focusTrigger = false } = options;
    const triggerToFocus =
      openMenu === 'create' ? createTriggerRef.current : openMenu === 'avatar' ? avatarTriggerRef.current : null;
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

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [closeMenus]);

  useEffect(() => {
    if (openMenu === 'create') {
      requestAnimationFrame(() => {
        createMenuFirstItemRef.current?.focus();
      });
    }

    if (openMenu === 'avatar') {
      requestAnimationFrame(() => {
        avatarMenuFirstItemRef.current?.focus();
      });
    }
  }, [openMenu]);

  useEffect(() => {
    if (!canShowCreateMenu && openMenu === 'create') {
      closeMenus();
    }
  }, [canShowCreateMenu, closeMenus, openMenu]);

  const handleOpenMenu = useCallback((menuName) => {
    if (menuName === 'create' && !canShowCreateMenu) {
      return;
    }

    setOpenMenu(menuName);
  }, [canShowCreateMenu]);

  const handleLogout = useCallback(async () => {
    setOpenMenu(null);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      // Logout deve falhar de forma silenciosa no cliente e ainda assim redirecionar.
    }

    router.replace('/login');
  }, [router]);

  if (currentPathname === '/login') {
    return null;
  }

  return (
    <nav ref={navRef} className={styles.shell} aria-label="Menu principal">
      <div className={styles.inner}>
        <Link
          href="/escalas"
          className={`${styles.item} ${escalasActive ? styles.itemActive : ''}`}
          aria-label="Escalas"
          aria-current={escalasActive ? 'page' : undefined}
        >
          <HomeIcon />
          <span className={styles.srOnly}>Escalas</span>
        </Link>

        <Link
          href="/componentes"
          className={`${styles.item} ${componentesActive ? styles.itemActive : ''}`}
          aria-label="Componentes"
          aria-current={componentesActive ? 'page' : undefined}
        >
          <GridIcon />
          <span className={styles.srOnly}>Componentes</span>
        </Link>

        {canShowCreateMenu ? (
          <div className={styles.actionSlot}>
            <button
              ref={createTriggerRef}
              type="button"
              className={`${styles.actionButton} ${openMenu === 'create' ? styles.actionButtonOpen : ''}`}
              aria-label="Abrir menu de cadastros"
              aria-expanded={openMenu === 'create'}
              aria-controls="main-bottom-nav-create-menu"
              onClick={() => handleOpenMenu('create')}
            >
              <PlusIcon />
            </button>

            {openMenu === 'create' ? (
              <div id="main-bottom-nav-create-menu" className={styles.popover} role="group" aria-label="Atalhos de cadastro">
                <Link
                  ref={createMenuFirstItemRef}
                  href="/cadastro-escalas"
                  className={styles.popoverItem}
                >
                  Nova escala
                </Link>
                <Link href="/cadastro-componentes" className={styles.popoverItem}>
                  Novo componente
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        {canShowSettingsLink ? (
          <Link
            href="/configuracoes-gerais-grupo"
            className={`${styles.item} ${styles.groupSettingsItem} ${configuracoesActive ? styles.itemActive : ''}`}
            aria-label="Configuracoes gerais do grupo"
            aria-current={configuracoesActive ? 'page' : undefined}
          >
            <SettingsIcon />
            <span className={styles.srOnly}>Configuracoes gerais do grupo</span>
          </Link>
        ) : null}

        <div className={styles.avatarSlot}>
          <button
            ref={avatarTriggerRef}
            type="button"
            className={`${styles.avatarButton} ${openMenu === 'avatar' ? styles.avatarButtonOpen : ''}`}
            aria-label={`Menu do grupo ${settings.name}`}
            aria-expanded={openMenu === 'avatar'}
            aria-controls="main-bottom-nav-avatar-menu"
            onClick={() => handleOpenMenu('avatar')}
          >
            <span className={styles.avatarFrame} aria-hidden="true">
              {settings.photo ? (
                <Image
                  src={settings.photo}
                  alt=""
                  fill
                  sizes="40px"
                  className={styles.avatarImage}
                />
              ) : (
                <span className={styles.avatarFallback}>{initials}</span>
              )}
            </span>
            <span className={styles.srOnly}>Avatar do grupo</span>
          </button>

          {openMenu === 'avatar' ? (
            <div id="main-bottom-nav-avatar-menu" className={styles.popover} role="group" aria-label="Menu do avatar">
              <Link
                ref={avatarMenuFirstItemRef}
                href="/editar-perfil"
                className={styles.popoverItem}
              >
                Editar perfil
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
