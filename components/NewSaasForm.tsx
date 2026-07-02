'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createSaasApp } from '@/lib/actions';

export function NewSaasForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ slug: string; apiKey: string } | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await createSaasApp(formData);
    setPending(false);
    if (!res.ok) {
      setError(res.error ?? 'Erreur inconnue.');
      return;
    }
    setResult({ slug: res.slug!, apiKey: res.apiKey! });
  }

  if (result) {
    return (
      <div className="chart-card" style={{ maxWidth: 560 }}>
        <div className="chart-card-title" style={{ marginBottom: 12 }}>
          SaaS créé ✓
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
          Voici sa clé API — copie-la maintenant, elle ne sera plus jamais affichée (seule son
          empreinte est conservée). Elle sert à authentifier les pushs automatiques (voir{' '}
          <code>scripts/push-metrics-example</code>), ou tu peux te contenter du relevé manuel
          ci-dessous pour l&apos;instant.
        </p>
        <div
          className="mono"
          style={{
            background: 'var(--chip-bg)',
            padding: '10px 12px',
            borderRadius: 8,
            fontSize: 13,
            wordBreak: 'break-all',
            marginBottom: 16,
          }}
        >
          {result.apiKey}
        </div>
        <Link href={`/${result.slug}`} className="login-submit" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Aller à la fiche {result.slug} →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="chart-card" style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="login-field">
        <label htmlFor="name">Nom du SaaS</label>
        <input id="name" name="name" required placeholder="Vumos" />
      </div>
      <div className="login-field">
        <label htmlFor="slug">Slug (URL) — laisser vide pour le générer depuis le nom</label>
        <input id="slug" name="slug" placeholder="vumos" />
      </div>
      <div className="login-field">
        <label htmlFor="accentColor">Couleur d&apos;accent (hex)</label>
        <input id="accentColor" name="accentColor" required placeholder="#8e57d8" pattern="^#[0-9a-fA-F]{6}$" />
      </div>
      <div className="login-field">
        <label htmlFor="tagline">Tagline</label>
        <input id="tagline" name="tagline" placeholder="Assistant IA de préparation de séance" />
      </div>
      <div className="login-field">
        <label htmlFor="category">Catégorie</label>
        <input id="category" name="category" placeholder="Accompagnement non-médical" />
      </div>
      <div className="login-field">
        <label htmlFor="featuredPlan">Formule phare</label>
        <input id="featuredPlan" name="featuredPlan" placeholder="Pro" />
      </div>
      {error && <div className="login-error">{error}</div>}
      <button className="login-submit" type="submit" disabled={pending}>
        {pending ? 'Création…' : 'Créer le SaaS'}
      </button>
    </form>
  );
}
