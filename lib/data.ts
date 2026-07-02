import { createClient } from '@/lib/supabase/server';
import type { Plan, SaasApp, Snapshot } from '@/lib/types';

function toSaasApp(row: {
  id: string;
  name: string;
  slug: string;
  accent_color: string;
  tagline: string | null;
  category: string | null;
  featured_plan: string | null;
}): SaasApp {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    accentColor: row.accent_color,
    tagline: row.tagline,
    category: row.category,
    featuredPlan: row.featured_plan,
  };
}

function toSnapshot(row: {
  snapshot_date: string;
  mrr: number;
  subscribers_total: number;
  subscribers_by_plan: unknown;
  new_subscribers: number;
  churned_subscribers: number;
  currency: string;
}): Snapshot {
  return {
    date: row.snapshot_date,
    mrr: Number(row.mrr),
    subscribersTotal: row.subscribers_total,
    subscribersByPlan: (row.subscribers_by_plan as Plan[]) ?? [],
    newSubscribers: row.new_subscribers,
    churnedSubscribers: row.churned_subscribers,
    currency: row.currency,
  };
}

export async function getSaasApps(): Promise<SaasApp[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('saas_apps').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(toSaasApp);
}

export async function getSaasBySlug(slug: string): Promise<SaasApp | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('saas_apps').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data ? toSaasApp(data) : null;
}

/** Ascending by date. `sinceDays` should cover the widest window the caller needs (13 months for the 12m chart). */
export async function getSnapshots(saasId: string, sinceDays: number): Promise<Snapshot[]> {
  const supabase = await createClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - sinceDays);
  const { data, error } = await supabase
    .from('metrics_snapshots')
    .select('*')
    .eq('saas_id', saasId)
    .gte('snapshot_date', cutoff.toISOString().slice(0, 10))
    .order('snapshot_date', { ascending: true });
  if (error) throw error;
  return data.map(toSnapshot);
}
