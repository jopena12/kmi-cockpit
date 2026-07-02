'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteSaasApp } from '@/lib/actions';

interface DeleteSaasButtonProps {
  slug: string;
  name: string;
}

export function DeleteSaasButton({ slug, name }: DeleteSaasButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText.trim().toLowerCase() === name.trim().toLowerCase();

  async function handleDelete() {
    if (!canDelete) return;
    setPending(true);
    setError(null);
    const res = await deleteSaasApp(slug);
    setPending(false);
    if (!res.ok) {
      setError(res.error ?? 'Erreur inconnue.');
      return;
    }
    router.push('/');
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ all: 'unset', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}
      >
        Supprimer ce SaaS
      </button>
    );
  }

  return (
    <div className="chart-card" style={{ maxWidth: 480, borderColor: 'var(--negative)' }}>
      <div className="chart-card-title" style={{ color: 'var(--negative)', marginBottom: 8 }}>
        Supprimer {name} ?
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 12px' }}>
        Action définitive : supprime aussi tout l&apos;historique de métriques et la clé API de ce
        SaaS. Tape <strong>{name}</strong> ci-dessous pour confirmer.
      </p>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder={name}
        style={{
          width: '100%',
          fontSize: 13.5,
          padding: '9px 11px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          marginBottom: 12,
          boxSizing: 'border-box',
        }}
      />
      {error && <div className="login-error" style={{ marginBottom: 10 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleDelete}
          disabled={!canDelete || pending}
          className="login-submit"
          style={{ flex: 1, background: canDelete ? 'var(--negative)' : 'var(--border)' }}
        >
          {pending ? 'Suppression…' : 'Supprimer définitivement'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmText('');
            setError(null);
          }}
          className="login-submit"
          style={{ flex: 'none', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
