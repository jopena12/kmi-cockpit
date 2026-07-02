import { notFound } from 'next/navigation';
import { getSaasBySlug, getSnapshots } from '@/lib/data';
import { buildDetail } from '@/lib/metrics';
import { parsePeriod } from '@/lib/period';
import { TopBar } from '@/components/TopBar';
import { DetailView } from '@/components/DetailView';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ period?: string }>;
}

export default async function SaasDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { period: periodParam } = await searchParams;
  const period = parsePeriod(periodParam);

  const saas = await getSaasBySlug(slug);
  if (!saas) notFound();

  // 400 jours couvre large les 13 mois nécessaires à la vue "12 mois".
  const snapshots = await getSnapshots(saas.id, 400);
  const detail = buildDetail(snapshots, period, saas.accentColor);

  return (
    <>
      <TopBar title={saas.name} subtitle={saas.category ?? ''} showBack />
      <div className="content">
        {detail ? (
          <DetailView saas={saas} detail={detail} />
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>
            Aucune métrique reçue pour {saas.name} pour le moment.
          </p>
        )}
      </div>
    </>
  );
}
