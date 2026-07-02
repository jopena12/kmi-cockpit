'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { churnColor } from '@/lib/theme';
import type { BarPoint } from '@/lib/metrics';

interface NewVsChurnChartProps {
  data: BarPoint[];
  accent: string;
}

const axisTick = { fontSize: 10, fontFamily: 'var(--font-plex-mono), monospace', fill: 'var(--text-muted)' };

export function NewVsChurnChart({ data, accent }: NewVsChurnChartProps) {
  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} margin={{ top: 10, right: 6, bottom: 0, left: 6 }} barGap={3}>
        <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="0" />
        <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            fontFamily: 'var(--font-plex-mono), monospace',
            fontSize: 12,
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        />
        <Bar dataKey="new" name="Nouveaux" fill={accent} radius={[1.5, 1.5, 0, 0]} maxBarSize={18} isAnimationActive={false} />
        <Bar
          dataKey="churn"
          name="Résiliations"
          fill={churnColor}
          radius={[1.5, 1.5, 0, 0]}
          maxBarSize={18}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
