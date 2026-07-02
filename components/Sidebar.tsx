'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SaasApp } from '@/lib/types';
import { LogoutButton } from './LogoutButton';

export function Sidebar({ saas }: { saas: SaasApp[] }) {
  const pathname = usePathname();
  const isOverview = pathname === '/';
  const activeSlug = isOverview ? null : pathname.slice(1);

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">KMI</span>
        <span className="sidebar-brand-name">Cockpit</span>
      </div>

      <div className="nav-section">
        <Link
          href="/"
          className="nav-button nav-button--overview"
          style={{ background: isOverview ? 'var(--surface-hover)' : 'transparent' }}
        >
          Vue d&apos;ensemble
        </Link>
      </div>

      <div className="nav-section">
        <span className="nav-label">Produits</span>
        <div className="nav-items">
          {saas.map((s) => (
            <Link
              key={s.id}
              href={`/${s.slug}`}
              className="nav-button"
              style={{ background: activeSlug === s.slug ? 'var(--surface-hover)' : 'transparent' }}
            >
              <span className="nav-dot" style={{ background: s.accentColor }} />
              <span>{s.name}</span>
            </Link>
          ))}
          <Link
            href="/new-saas"
            className="nav-button"
            style={{ background: pathname === '/new-saas' ? 'var(--surface-hover)' : 'transparent', color: 'var(--text-muted)' }}
          >
            <span className="nav-dot" style={{ background: 'transparent', border: '1px dashed var(--text-muted)' }} />
            <span>+ Ajouter un SaaS</span>
          </Link>
        </div>
      </div>

      <div className="sidebar-footer">
        Tour de contrôle multi-SaaS
        <div style={{ marginTop: 10 }}>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
