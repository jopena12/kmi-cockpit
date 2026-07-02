import type { CardData } from '@/lib/metrics';
import type { SaasApp } from '@/lib/types';
import { SaasCard } from './SaasCard';

export function OverviewGrid({ items }: { items: { saas: SaasApp; card: CardData }[] }) {
  return (
    <div className="overview-grid">
      {items.map(({ saas, card }) => (
        <SaasCard key={saas.id} saas={saas} card={card} />
      ))}
    </div>
  );
}
