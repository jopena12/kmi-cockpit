import { withAlpha } from './color';
import { fmtDayMonth, fmtShortMonth } from './format';
import type { Period, Plan, Snapshot } from './types';

const PERIOD_LABELS: Record<Period, string> = {
  '7j': '7 derniers jours',
  '30j': '30 derniers jours',
  '12m': '12 derniers mois',
};

const PLAN_OPACITIES = [1, 0.62, 0.34];

/** Avoids NaN/Infinity when the denominator is 0 (e.g. a brand-new SaaS with no baseline yet). */
function safeRatio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

function bucketAvg(values: number[], n: number) {
  const size = values.length / n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const slice = values.slice(Math.round(i * size), Math.round((i + 1) * size));
    out.push(slice.reduce((a, b) => a + b, 0) / (slice.length || 1));
  }
  return out;
}

function bucketSum(values: number[], n: number) {
  const size = values.length / n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const slice = values.slice(Math.round(i * size), Math.round((i + 1) * size));
    out.push(slice.reduce((a, b) => a + b, 0));
  }
  return out;
}

function bucketLabel(dates: string[], n: number) {
  const size = dates.length / n;
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.min(dates.length - 1, Math.round((i + 0.5) * size));
    out.push(dates[idx]);
  }
  return out;
}

/** Picks the most recent snapshot within each of the last 12 calendar months present in the series. */
function lastMonthlySnapshots(snapshots: Snapshot[]): Snapshot[] {
  const byMonth = new Map<string, Snapshot>();
  for (const s of snapshots) {
    const monthKey = s.date.slice(0, 7); // yyyy-mm
    byMonth.set(monthKey, s); // snapshots are ascending, so the last write per key is the latest in-month
  }
  return [...byMonth.values()].slice(-12);
}

export interface ChartPoint {
  label: string;
  mrr: number;
}

export interface BarPoint {
  label: string;
  new: number;
  churn: number;
}

export interface PlanDistSegment {
  name: string;
  price: number;
  count: number;
  pct: number;
  color: string;
}

export interface Detail {
  kpiMrr: number;
  kpiMrrDelta: string;
  kpiMrrDeltaPositive: boolean;
  kpiSubs: number;
  kpiNetNew: string;
  kpiChurn: string;
  periodLabel: string;
  currency: string;
  lineChart: ChartPoint[];
  barChart: BarPoint[];
  planDist: PlanDistSegment[];
}

/** `snapshots` must be ascending by date and should cover at least ~13 months for the 12m view. */
export function buildDetail(snapshots: Snapshot[], period: Period, accent: string): Detail | null {
  if (snapshots.length === 0) return null;

  const latest = snapshots[snapshots.length - 1];

  let periodSnapshots: Snapshot[];
  let lineChart: ChartPoint[];
  let newSeries: number[];
  let churnSeries: number[];

  if (period === '7j') {
    periodSnapshots = snapshots.slice(-7);
    lineChart = periodSnapshots.map((s) => ({ label: fmtDayMonth(s.date), mrr: s.mrr }));
    newSeries = periodSnapshots.map((s) => s.newSubscribers);
    churnSeries = periodSnapshots.map((s) => s.churnedSubscribers);
  } else if (period === '30j') {
    periodSnapshots = snapshots.slice(-30);
    const dates = periodSnapshots.map((s) => s.date);
    const labels = bucketLabel(dates, 6).map(fmtDayMonth);
    const mrrBuckets = bucketAvg(
      periodSnapshots.map((s) => s.mrr),
      6
    );
    lineChart = labels.map((label, i) => ({ label, mrr: mrrBuckets[i] }));
    newSeries = bucketSum(
      periodSnapshots.map((s) => s.newSubscribers),
      6
    );
    churnSeries = bucketSum(
      periodSnapshots.map((s) => s.churnedSubscribers),
      6
    );
  } else {
    periodSnapshots = lastMonthlySnapshots(snapshots);
    lineChart = periodSnapshots.map((s) => ({ label: fmtShortMonth(s.date), mrr: s.mrr }));
    newSeries = periodSnapshots.map((s) => s.newSubscribers);
    churnSeries = periodSnapshots.map((s) => s.churnedSubscribers);
  }

  const barChart: BarPoint[] = lineChart.map((pt, i) => ({ label: pt.label, new: newSeries[i], churn: churnSeries[i] }));

  const mrrStart = periodSnapshots[0].mrr;
  const mrrEnd = latest.mrr;
  const mrrDeltaPct = safeRatio(mrrEnd - mrrStart, mrrStart) * 100;
  const netNew = newSeries.reduce((a, b) => a + b, 0) - churnSeries.reduce((a, b) => a + b, 0);
  const churnSum = churnSeries.reduce((a, b) => a + b, 0);
  const churnRate = safeRatio(churnSum, latest.subscribersTotal) * 100;

  const planDist: PlanDistSegment[] = latest.subscribersByPlan.map((p: Plan, i: number) => ({
    name: p.name,
    price: p.price,
    count: p.count,
    pct: Math.round(safeRatio(p.count, latest.subscribersTotal) * 100),
    color: withAlpha(accent, PLAN_OPACITIES[i] ?? 0.3),
  }));

  return {
    kpiMrr: latest.mrr,
    kpiMrrDelta: (mrrDeltaPct >= 0 ? '+' : '') + mrrDeltaPct.toFixed(1) + ' %',
    kpiMrrDeltaPositive: mrrDeltaPct >= 0,
    kpiSubs: latest.subscribersTotal,
    kpiNetNew: (netNew >= 0 ? '+' : '') + netNew,
    kpiChurn: churnRate.toFixed(1) + ' %',
    periodLabel: PERIOD_LABELS[period],
    currency: latest.currency ?? 'EUR',
    lineChart,
    barChart,
    planDist,
  };
}

export interface CardData {
  mrr: number;
  subs: number;
  currency: string;
  deltaLabel: string;
  deltaPositive: boolean;
}

/** `snapshots` must be ascending by date and cover at least ~31 days for a stable month-over-month delta. */
export function buildCard(snapshots: Snapshot[]): CardData | null {
  if (snapshots.length === 0) return null;
  const latest = snapshots[snapshots.length - 1];
  const baseline = snapshots[0];
  const deltaPct = safeRatio(latest.mrr - baseline.mrr, baseline.mrr) * 100;
  return {
    mrr: latest.mrr,
    subs: latest.subscribersTotal,
    currency: latest.currency ?? 'EUR',
    deltaLabel: `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)} % vs mois dernier`,
    deltaPositive: deltaPct >= 0,
  };
}
