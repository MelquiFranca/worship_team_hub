'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import ComponentUnavailabilityForm from '@/components/organisms/ComponentUnavailabilityForm/ComponentUnavailabilityForm';
import { useAuthSession } from '@/context/AuthSessionContext';
import { useGroupSettings } from '@/context/GroupSettingsContext';
import styles from './page.module.css';

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

export default function EditProfileFallbackPage() {
  const { settings } = useGroupSettings();
  const { permissions, isLoading } = useAuthSession();
  const initials = useMemo(() => getInitials(settings.name || ''), [settings.name]);

  if (!isLoading && permissions.isComponentApp) {
    return (
      <main className={styles.page}>
        <ComponentUnavailabilityForm />
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="edit-profile-title">
        <div className={styles.avatar} aria-hidden="true">
          {settings.photo ? (
            <Image src={settings.photo} alt="" fill sizes="88px" className={styles.avatarImage} />
          ) : (
            <span className={styles.avatarFallback}>{initials}</span>
          )}
        </div>

        <div className={styles.content}>
          <p className={styles.kicker}>Perfil do grupo</p>
          <h1 id="edit-profile-title" className={styles.title}>
            Editar perfil
          </h1>
          <p className={styles.description}>
            Esta rota funciona como fallback local nesta versao. O menu do avatar aponta para este endereco enquanto a
            area completa de edicao de perfil nao esta disponivel.
          </p>
        </div>

        <div className={styles.actions}>
          <Link href="/configuracoes-gerais-grupo" className={styles.primaryAction}>
            Abrir configuracoes do grupo
          </Link>
          <Link href="/escalas" className={styles.secondaryAction}>
            Voltar para escalas
          </Link>
        </div>
      </section>
    </main>
  );
}
