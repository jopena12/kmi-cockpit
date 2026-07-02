import Link from 'next/link';
import { withAlpha } from '@/lib/color';
import { fmtAmount } from '@/lib/format';
import type { CardData } from '@/lib/metrics';
import type { SaasApp } from '@/lib/types';

interface SaasCardProps {
  saas: SaasApp;
  card: CardData;
}

export function SaasCard({ saas, card }: SaasCardProps) {
  return (
    <Link href={`/${saas.slug}`} className="card" style={{ borderLeft: `4px solid ${saas.accentColor}` }}>
      <div className="card-top-row">
        <div className="card-badge" style={{ background: withAlpha(saas.accentColor, 0.12), color: saas.accentColor }}>
          <span className="card-badge-dot" style={{ background: saas.accentColor }} />
          {saas.name}
        </div>
        <span className="card-chevron">→</span>
      </div>
      {saas.tagline && <div className="card-tagline">{saas.tagline}</div>}
      <div className="card-mrr mono">{fmtAmount(card.mrr, card.currency)}</div>
      <div className="card-subs">{card.subs} abonnés actifs</div>
      <div>
        <span className={`card-delta ${card.deltaPositive ? 'card-delta--positive' : 'card-delta--negative'}`}>
          {card.deltaPositive ? '▲' : '▼'} {card.deltaLabel}
        </span>
      </div>
    </Link>
  );
}
