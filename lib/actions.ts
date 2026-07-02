'use server';

import { randomBytes, createHash } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/database.types';

export interface CreateSaasResult {
  ok: boolean;
  error?: string;
  slug?: string;
  apiKey?: string;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createSaasApp(formData: FormData): Promise<CreateSaasResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Non authentifié.' };

  const name = String(formData.get('name') ?? '').trim();
  const accentColor = String(formData.get('accentColor') ?? '').trim();
  const tagline = String(formData.get('tagline') ?? '').trim() || null;
  const category = String(formData.get('category') ?? '').trim() || null;
  const featuredPlan = String(formData.get('featuredPlan') ?? '').trim() || null;
  const slugInput = String(formData.get('slug') ?? '').trim();
  const slug = slugify(slugInput || name);

  if (!name) return { ok: false, error: 'Le nom est requis.' };
  if (!/^#[0-9a-fA-F]{6}$/.test(accentColor)) {
    return { ok: false, error: "La couleur d'accent doit être un hex du type #8e57d8." };
  }
  if (!slug) return { ok: false, error: 'Slug invalide.' };

  const { data: saas, error: saasError } = await supabase
    .from('saas_apps')
    .insert({ name, slug, accent_color: accentColor, tagline, category, featured_plan: featuredPlan })
    .select('id, slug')
    .single();

  if (saasError) {
    if (saasError.code === '23505') return { ok: false, error: 'Ce slug existe déjà.' };
    return { ok: false, error: saasError.message };
  }

  const secret = 'kmi_' + randomBytes(24).toString('hex');
  const keyHash = createHash('sha256').update(secret).digest('hex');

  const { error: keyError } = await supabase.from('api_keys').insert({ saas_id: saas.id, key_hash: keyHash });
  if (keyError) return { ok: false, error: `SaaS créé mais échec de la clé API : ${keyError.message}` };

  revalidatePath('/');
  return { ok: true, slug: saas.slug, apiKey: secret };
}

export interface ManualSnapshotResult {
  ok: boolean;
  error?: string;
}

interface PlanRow {
  name: string;
  price: number;
  count: number;
}

function parsePlanLines(raw: string): PlanRow[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, price, count] = line.split(',').map((s) => s.trim());
      return { name, price: Number(price), count: Number(count) };
    })
    .filter((p) => p.name && Number.isFinite(p.price) && Number.isFinite(p.count));
}

export async function addManualSnapshot(saasSlug: string, formData: FormData): Promise<ManualSnapshotResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Non authentifié.' };

  const { data: saas, error: saasError } = await supabase
    .from('saas_apps')
    .select('id')
    .eq('slug', saasSlug)
    .maybeSingle();
  if (saasError || !saas) return { ok: false, error: 'SaaS introuvable.' };

  const snapshotDate = String(formData.get('snapshotDate') ?? '').trim() || new Date().toISOString().slice(0, 10);
  const planLines = String(formData.get('plans') ?? '');
  const plans = parsePlanLines(planLines);

  const mrrInput = String(formData.get('mrr') ?? '').trim();
  const subsInput = String(formData.get('subscribersTotal') ?? '').trim();

  const mrr = plans.length > 0 ? plans.reduce((s, p) => s + p.price * p.count, 0) : Number(mrrInput);
  const subscribersTotal = plans.length > 0 ? plans.reduce((s, p) => s + p.count, 0) : Number(subsInput);

  if (!Number.isFinite(mrr) || !Number.isFinite(subscribersTotal)) {
    return { ok: false, error: 'MRR et abonnés doivent être numériques (ou renseigne la liste des formules).' };
  }

  const newSubscribers = Number(formData.get('newSubscribers') ?? 0) || 0;
  const churnedSubscribers = Number(formData.get('churnedSubscribers') ?? 0) || 0;

  const { error } = await supabase.from('metrics_snapshots').upsert(
    {
      saas_id: saas.id,
      snapshot_date: snapshotDate,
      mrr,
      subscribers_total: subscribersTotal,
      subscribers_by_plan: plans as unknown as Json,
      new_subscribers: newSubscribers,
      churned_subscribers: churnedSubscribers,
      currency: 'EUR',
    },
    { onConflict: 'saas_id,snapshot_date' }
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/${saasSlug}`);
  revalidatePath('/');
  return { ok: true };
}
