'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { addManualSnapshot } from '@/lib/actions';

export function ManualSnapshotForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    const res = await addManualSnapshot(slug, formData);
    setPending(false);
    if (!res.ok) {
      setError(res.error ?? 'Erreur inconnue.');
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="detail-chip" style={{ all: 'unset', cursor: 'pointer' }} onClick={() => setOpen(true)}>
        <span className="detail-chip" style={{ display: 'inline-flex' }}>
          + Ajouter un relevé manuel
        </span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="chart-card" style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="chart-card-title">Relevé manuel</div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
        Renseigne soit le MRR + abonnés totaux directement, soit la liste des formules (une ligne par
        formule, format <code>nom,prix,nombre</code>) — dans ce cas le MRR et le total sont calculés
        automatiquement.
      </p>
      <div className="login-field">
        <label htmlFor="snapshotDate">Date</label>
        <input id="snapshotDate" name="snapshotDate" type="date" defaultValue={today} />
      </div>
      <div className="login-field">
        <label htmlFor="mrr">MRR (€) — si pas de liste de formules</label>
        <input id="mrr" name="mrr" type="number" step="0.01" placeholder="13120" />
      </div>
      <div className="login-field">
        <label htmlFor="subscribersTotal">Abonnés actifs — si pas de liste de formules</label>
        <input id="subscribersTotal" name="subscribersTotal" type="number" placeholder="340" />
      </div>
      <div className="login-field">
        <label htmlFor="plans">Formules (optionnel, une par ligne : nom,prix,nombre)</label>
        <textarea
          id="plans"
          name="plans"
          rows={3}
          placeholder={'Starter,19,109\nPro,39,180\nStudio,79,51'}
          style={{
            fontFamily: 'inherit',
            fontSize: 13.5,
            padding: '9px 11px',
            borderRadius: 6,
            border: '1px solid var(--border)',
          }}
        />
      </div>
      <div className="login-field">
        <label htmlFor="newSubscribers">Nouveaux abonnés (période)</label>
        <input id="newSubscribers" name="newSubscribers" type="number" defaultValue={0} />
      </div>
      <div className="login-field">
        <label htmlFor="churnedSubscribers">Résiliations (période)</label>
        <input id="churnedSubscribers" name="churnedSubscribers" type="number" defaultValue={0} />
      </div>
      {error && <div className="login-error">{error}</div>}
      {success && <div style={{ fontSize: 12.5, color: 'var(--positive)' }}>Relevé enregistré ✓</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="login-submit" type="submit" disabled={pending} style={{ flex: 1 }}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          type="button"
          className="login-submit"
          style={{ flex: 'none', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          onClick={() => setOpen(false)}
        >
          Fermer
        </button>
      </div>
    </form>
  );
}
