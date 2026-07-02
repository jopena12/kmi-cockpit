// push-metrics (variante Stripe) — Edge Function planifiée quotidienne à déployer
// dans le projet Supabase DE VUMOS (pas dans kmi-cockpit-hub).
//
// Calcule MRR / abonnés / répartition par formule / nouveaux / résiliations
// directement depuis Stripe (source de vérité pour la facturation, quel que
// soit le schéma interne de la base Vumos), puis pousse le résultat vers
// ingest-metrics sur le Hub.
//
// Secrets requis (à définir dans CE projet Supabase, jamais dans le Hub) :
//   STRIPE_SECRET_KEY   clé secrète Stripe (sk_live_... ou une clé restreinte
//                       en lecture seule sur Subscriptions/Prices/Products/Events)
//   HUB_INGEST_URL      https://owzlkqjtsgwbygxlwfnx.supabase.co/functions/v1/ingest-metrics
//   HUB_API_KEY         clé fournie par le Hub pour Vumos (jamais commitée en clair)
//
// Limite connue : suppose UNE seule ligne d'abonnement (subscription item) par
// subscription Stripe, ce qui couvre l'immense majorité des SaaS à formules
// simples. Si Vumos vend plusieurs produits dans un même abonnement Stripe,
// adapter `monthlyAmountForSub` pour sommer tous les items.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const hubIngestUrl = Deno.env.get("HUB_INGEST_URL")!;
const hubApiKey = Deno.env.get("HUB_API_KEY")!;

const STRIPE_API = "https://api.stripe.com/v1";

async function stripeGet(path: string, params: Record<string, string> = {}) {
  const url = new URL(STRIPE_API + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${stripeKey}` } });
  if (!res.ok) throw new Error(`Stripe ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

interface StripeSubscription {
  id: string;
  status: string;
  created: number; // unix seconds
  canceled_at: number | null;
  items: { data: { price: { unit_amount: number; recurring: { interval: string; interval_count: number }; product: string } }[] };
}

async function listAllActiveSubscriptions(): Promise<StripeSubscription[]> {
  const all: StripeSubscription[] = [];
  let startingAfter: string | undefined;
  for (;;) {
    const page = await stripeGet("/subscriptions", {
      status: "active",
      limit: "100",
      // Stripe limite l'expand à 4 niveaux sur les endpoints de liste — on
      // s'arrête à `price` (4 niveaux) et on résout les noms de produits
      // séparément dans fetchProductNames().
      "expand[]": "data.items.data.price",
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    all.push(...page.data);
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1].id;
  }
  return all;
}

async function fetchProductNames(productIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(productIds)];
  const names = new Map<string, string>();
  for (const id of uniqueIds) {
    const product = await stripeGet(`/products/${id}`);
    names.set(id, product.name as string);
  }
  return names;
}

/** Normalise le prix d'un abonnement Stripe en équivalent mensuel, en euros. */
function monthlyAmountForSub(sub: StripeSubscription): number {
  const item = sub.items.data[0];
  if (!item) return 0;
  const { unit_amount, recurring } = item.price;
  const base = unit_amount / 100;
  const perCycle = base / (recurring.interval_count || 1);
  switch (recurring.interval) {
    case "year":
      return perCycle / 12;
    case "week":
      return perCycle * 4.345;
    case "day":
      return perCycle * 30.44;
    default:
      return perCycle; // "month"
  }
}

function todayRangeUtc() {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 1000;
  const end = start + 86400;
  return { start, end, dateStr: now.toISOString().slice(0, 10) };
}

Deno.serve(async () => {
  const { start, end, dateStr } = todayRangeUtc();

  const activeSubs = await listAllActiveSubscriptions();

  const mrr = activeSubs.reduce((sum, s) => sum + monthlyAmountForSub(s), 0);
  const subscribersTotal = activeSubs.length;

  const productIds = activeSubs.map((s) => s.items.data[0]?.price.product).filter((id): id is string => Boolean(id));
  const productNames = await fetchProductNames(productIds);

  const byPlan = new Map<string, { name: string; price: number; count: number }>();
  for (const s of activeSubs) {
    const item = s.items.data[0];
    if (!item) continue;
    const name = productNames.get(item.price.product) ?? item.price.product;
    const price = Math.round(monthlyAmountForSub(s) * 100) / 100;
    const existing = byPlan.get(name);
    if (existing) existing.count += 1;
    else byPlan.set(name, { name, price, count: 1 });
  }

  // Nouveaux abonnements créés aujourd'hui (toutes créations, actives ou non).
  const newSubscribers = activeSubs.filter((s) => s.created >= start && s.created < end).length;

  // Résiliations du jour, via l'API Events (plus fiable que de filtrer les
  // subscriptions actives, qui ne contiennent plus les résiliées).
  const cancelEvents = await stripeGet("/events", {
    type: "customer.subscription.deleted",
    "created[gte]": String(start),
    "created[lt]": String(end),
    limit: "100",
  });
  const churnedSubscribers = cancelEvents.data.length;

  const payload = {
    snapshot_date: dateStr,
    mrr: Math.round(mrr * 100) / 100,
    subscribers_total: subscribersTotal,
    subscribers_by_plan: [...byPlan.values()],
    new_subscribers: newSubscribers,
    churned_subscribers: churnedSubscribers,
    currency: "EUR",
  };

  const res = await fetch(hubIngestUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": hubApiKey },
    body: JSON.stringify(payload),
  });
  const body = await res.json();

  if (!res.ok) {
    console.error("ingest-metrics a refusé le snapshot", res.status, body);
    return new Response(JSON.stringify({ ok: false, status: res.status, body }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true, pushed: payload, hubResponse: body }), {
    headers: { "Content-Type": "application/json" },
  });
});
