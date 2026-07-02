// push-metrics — exemple à adapter et déployer comme Edge Function planifiée
// QUOTIDIENNE dans le projet Supabase de CHAQUE SaaS (pas dans kmi-cockpit-hub).
//
// Ce script :
//   1. Calcule les métriques du jour depuis la base du SaaS (à adapter — la
//      requête ci-dessous est un exemple générique).
//   2. Les pousse vers l'Edge Function ingest-metrics du Hub, authentifié par
//      une clé API dédiée à ce SaaS.
//
// Variables d'environnement attendues (à définir via `supabase secrets set`
// dans LE PROJET DU SAAS, jamais dans le Hub) :
//   HUB_INGEST_URL     ex. https://owzlkqjtsgwbygxlwfnx.supabase.co/functions/v1/ingest-metrics
//   HUB_API_KEY        la clé fournie par le Hub pour ce SaaS (jamais commitée en clair)
//   SUPABASE_URL       injecté automatiquement par le runtime Edge Functions
//   SUPABASE_SERVICE_ROLE_KEY  injecté automatiquement par le runtime Edge Functions
//
// Planification quotidienne : voir README.md de ce dossier (pg_cron + pg_net,
// ou Scheduled Edge Functions depuis le dashboard Supabase).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const hubIngestUrl = Deno.env.get("HUB_INGEST_URL")!;
const hubApiKey = Deno.env.get("HUB_API_KEY")!;

interface PlanBreakdown {
  name: string;
  price: number;
  count: number;
}

async function computeTodayMetrics(supabase: ReturnType<typeof createClient>) {
  // --- À ADAPTER : remplacer par le schéma réel du SaaS ---
  // Exemple générique en supposant deux tables `subscriptions` (abonnement actif
  // par client, avec un plan_name et un plan_price) et `subscription_events`
  // (lignes "new" / "churned" horodatées).
  const { data: activeSubs, error: subsError } = await supabase
    .from("subscriptions")
    .select("plan_name, plan_price")
    .eq("status", "active");
  if (subsError) throw subsError;

  const subscribersTotal = activeSubs.length;
  const mrr = activeSubs.reduce((sum, s) => sum + Number(s.plan_price), 0);

  const byPlan = new Map<string, PlanBreakdown>();
  for (const s of activeSubs) {
    const key = s.plan_name as string;
    const existing = byPlan.get(key);
    if (existing) existing.count += 1;
    else byPlan.set(key, { name: key, price: Number(s.plan_price), count: 1 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { count: newSubscribers } = await supabase
    .from("subscription_events")
    .select("*", { count: "exact", head: true })
    .eq("type", "new")
    .gte("created_at", `${today}T00:00:00Z`);
  const { count: churnedSubscribers } = await supabase
    .from("subscription_events")
    .select("*", { count: "exact", head: true })
    .eq("type", "churned")
    .gte("created_at", `${today}T00:00:00Z`);
  // --- fin de la section à adapter ---

  return {
    snapshot_date: today,
    mrr,
    subscribers_total: subscribersTotal,
    subscribers_by_plan: [...byPlan.values()],
    new_subscribers: newSubscribers ?? 0,
    churned_subscribers: churnedSubscribers ?? 0,
    currency: "EUR",
  };
}

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const metrics = await computeTodayMetrics(supabase);

  const res = await fetch(hubIngestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": hubApiKey,
    },
    body: JSON.stringify(metrics),
  });

  const body = await res.json();
  if (!res.ok) {
    console.error("ingest-metrics a refusé le snapshot", res.status, body);
    return new Response(JSON.stringify({ ok: false, status: res.status, body }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true, pushed: metrics, hubResponse: body }), {
    headers: { "Content-Type": "application/json" },
  });
});
