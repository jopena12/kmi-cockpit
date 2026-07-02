'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtCompact } from '@/lib/format';
import type { ChartPoint } from '@/lib/metrics';

interface MrrTrendChartProps {
  data: ChartPoint[];
  accent: string;
  currency: string;
}

const axisTick = { fontSize: 10, fontFamily: 'var(--font-plex-mono), monospace', fill: 'var(--text-muted)' };

export function MrrTrendChart({ data, accent, currency }: MrrTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 18, right: 6, bottom: 0, left: 6 }}>
        <defs>
          <linearGradient id="mrrArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity={0.16} />
            <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="0" />
        <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
        <YAxis
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={(v: number) => fmtCompact(v, currency)}
          domain={[(min: number) => min * 0.92, (max: number) => max * 1.08]}
        />
        <Tooltip
          formatter={(value) => fmtCompact(Number(value), currency)}
          contentStyle={{
            fontFamily: 'var(--font-plex-mono), monospace',
            fontSize: 12,
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        />
        <Area
          type="monotone"
          dataKey="mrr"
          stroke={accent}
          strokeWidth={2.5}
          fill="url(#mrrArea)"
          dot={{ r: 2.5, fill: accent, strokeWidth: 0 }}
          activeDot={{ r: 4, fill: accent }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
