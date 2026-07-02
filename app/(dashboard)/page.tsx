import { getSaasApps, getSnapshots } from '@/lib/data';
import { buildCard, type CardData } from '@/lib/metrics';
import type { SaasApp } from '@/lib/types';
import { TopBar } from '@/components/TopBar';
import { OverviewGrid } from '@/components/OverviewGrid';

export const revalidate = 0;

export default async function OverviewPage() {
  const saas = await getSaasApps();

  const items: { saas: SaasApp; card: CardData }[] = [];
  for (const s of saas) {
    const snapshots = await getSnapshots(s.id, 31);
    const card = buildCard(snapshots);
    if (card) items.push({ saas: s, card });
  }

  return (
    <>
      <TopBar
        title="Vue d'ensemble"
        subtitle={`${saas.length} produit${saas.length > 1 ? 's' : ''} connecté${saas.length > 1 ? 's' : ''}`}
      />
      <div className="content">
        {items.length > 0 ? (
          <OverviewGrid items={items} />
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>
            Aucune métrique reçue pour le moment. Une fois qu&apos;un SaaS aura poussé son premier snapshot via
            l&apos;Edge Function <code>ingest-metrics</code>, il apparaîtra ici.
          </p>
        )}
      </div>
    </>
  );
}
