'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { PlanDistSegment } from '@/lib/metrics';

export function PlanDistributionChart({ segments }: { segments: PlanDistSegment[] }) {
  return (
    <ResponsiveContainer width={150} height={150}>
      <PieChart>
        <Pie
          data={segments}
          dataKey="count"
          nameKey="name"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={2}
          stroke="none"
          isAnimationActive={false}
        >
          {segments.map((s) => (
            <Cell key={s.name} fill={s.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} abonnés`, name]}
          contentStyle={{
            fontFamily: 'var(--font-plex-sans), sans-serif',
            fontSize: 12,
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
