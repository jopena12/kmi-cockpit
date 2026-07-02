'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Period } from '@/lib/types';

const PERIOD_DEFS: { key: Period; label: string }[] = [
  { key: '7j', label: '7 j' },
  { key: '30j', label: '30 j' },
  { key: '12m', label: '12 mois' },
];

export function PeriodSelector() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get('period') as Period | null) ?? '12m';

  return (
    <div className="period-selector">
      {PERIOD_DEFS.map((opt) => {
        const active = current === opt.key;
        return (
          <Link
            key={opt.key}
            href={`${pathname}?period=${opt.key}`}
            className="period-option"
            style={{
              background: active ? 'var(--surface)' : 'transparent',
              color: active ? 'var(--text)' : 'var(--text-muted)',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
