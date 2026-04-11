'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { useGroupSettings } from '@/context/GroupSettingsContext';

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

export default function HomePage() {
  const { settings } = useGroupSettings();
  const groupInitials = useMemo(() => getInitials(settings.name || ''), [settings.name]);

  return (
    <main className="container" style={{ maxWidth: '920px', display: 'grid', gap: '20px' }}>
      <section
        style={{
          display: 'grid',
          gap: '16px',
          padding: '22px',
          borderRadius: '18px',
          background: 'var(--app-surface, #ffffff)',
          border: '1px solid var(--app-border, #d9e2ef)',
          boxShadow: 'var(--app-shadow, 0 14px 36px rgba(15, 23, 42, 0.08))'
        }}
        aria-labelledby="home-group-title"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div
            role="img"
            aria-label={settings.photo ? `Foto do grupo ${settings.name}` : `Identidade do grupo ${settings.name}`}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '22px',
              overflow: 'hidden',
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(135deg, var(--app-accent, #f97316), var(--app-accent-strong, #ff0169))',
              color: '#ffffff',
              fontSize: '1.6rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              flex: '0 0 auto'
            }}
          >
            {settings.photo ? (
              <Image src={settings.photo} alt="" width={72} height={72} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              groupInitials
            )}
          </div>

          <div style={{ display: 'grid', gap: '4px', minWidth: 0 }}>
            <p style={{ margin: 0, color: 'var(--app-text-muted, #4b5563)', fontSize: '0.9rem' }}>Grupo ativo</p>
            <h1 id="home-group-title" style={{ margin: 0, color: 'var(--app-text, #0f172a)', fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}>
              {settings.name}
            </h1>
            <p style={{ margin: 0, color: 'var(--app-text-muted, #4b5563)', lineHeight: 1.6 }}>
              Acesse escalas, componentes e cadastros com a identidade visual do grupo.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <Link
            href="/configuracoes-gerais-grupo"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '44px',
              padding: '0 16px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, var(--app-accent, #f97316), var(--app-accent-strong, #ff0169))',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 700
            }}
          >
            Abrir configuracoes do grupo
          </Link>
          <Link
            href="/escalas"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '44px',
              padding: '0 16px',
              borderRadius: '999px',
              border: '1px solid var(--app-border, #d9e2ef)',
              color: 'var(--app-text, #0f172a)',
              textDecoration: 'none',
              fontWeight: 700,
              background: 'var(--app-surface-elevated, #f8fbff)'
            }}
          >
            Ir para escalas
          </Link>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gap: '12px',
          padding: '18px 22px',
          borderRadius: '18px',
          background: 'var(--app-surface-elevated, #f8fbff)',
          border: '1px solid var(--app-border, #d9e2ef)'
        }}
      >
        <p style={{ margin: 0, color: 'var(--app-text-muted, #4b5563)', lineHeight: 1.6 }}>
          Acesse a <Link href="/login">tela de login</Link>, o <Link href="/escalas">feed de escalas</Link> ou a{' '}
          <Link href="/componentes">tela de componentes</Link>.
        </p>
        <p style={{ margin: 0, color: 'var(--app-text-muted, #4b5563)', lineHeight: 1.6 }}>
          Para cadastrar novos itens, visite a <Link href="/cadastro-componentes">tela de cadastro de componentes</Link>.
        </p>
        <p style={{ margin: 0, color: 'var(--app-text-muted, #4b5563)', lineHeight: 1.6 }}>
          Para montar uma escala completa, visite o <Link href="/cadastro-escalas">cadastro de escalas</Link>.
        </p>
      </section>
    </main>
  );
}
