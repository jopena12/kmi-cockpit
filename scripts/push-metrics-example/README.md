# push-metrics — script à déployer dans chaque SaaS

`index.ts` est un **exemple** d'Edge Function planifiée quotidienne à copier et
adapter dans le projet Supabase de **chaque SaaS** (pas dans `kmi-cockpit-hub`).
Elle calcule les métriques du jour depuis la base du SaaS et les pousse vers
`ingest-metrics` sur le Hub.

## 1. Adapter la requête

La fonction `computeTodayMetrics` contient une requête générique en supposant
des tables `subscriptions` / `subscription_events`. Remplacez-la par les
requêtes correspondant au schéma réel du SaaS. Le format de sortie attendu par
le Hub est fixe :

```ts
{
  snapshot_date: "2026-07-02",          // toujours la date du jour
  mrr: 13120.00,
  subscribers_total: 340,
  subscribers_by_plan: [{ name: "Pro", price: 39, count: 180 }, ...],
  new_subscribers: 3,
  churned_subscribers: 1,
  currency: "EUR",
}
```

Rappel de cohérence attendu côté Hub : `mrr` doit être égal à
`Σ(plan.price × plan.count)`.

## 2. Déployer dans le projet du SaaS

```bash
supabase functions deploy push-metrics --project-ref <ref-du-projet-du-saas>
```

## 3. Configurer les secrets (dans le projet du SaaS, pas le Hub)

```bash
supabase secrets set \
  HUB_INGEST_URL="https://owzlkqjtsgwbygxlwfnx.supabase.co/functions/v1/ingest-metrics" \
  HUB_API_KEY="<clé fournie par le Hub pour ce SaaS>" \
  --project-ref <ref-du-projet-du-saas>
```

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectées automatiquement
par le runtime Edge Functions — inutile de les définir.

La clé `HUB_API_KEY` n'est fournie qu'une seule fois à la création (le Hub ne
stocke que son hash). Si elle est perdue, il faut en régénérer une nouvelle
côté Hub (nouvelle ligne dans `api_keys`, ancienne à révoquer en la supprimant).

## 4. Planifier l'exécution quotidienne

Deux options :

**a. Scheduled Edge Functions (dashboard Supabase)** — Edge Functions →
`push-metrics` → Schedules → cron `0 3 * * *` (ex. 3h du matin).

**b. pg_cron + pg_net (SQL)** — depuis le SQL Editor du projet du SaaS :

```sql
select cron.schedule(
  'push-metrics-daily',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://<ref-du-projet-du-saas>.supabase.co/functions/v1/push-metrics',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
  );
  $$
);
```

## 5. Vérifier

Un appel réussi renvoie `{ "ok": true, "pushed": {...}, "hubResponse": {...} }`.
Le nouveau snapshot doit apparaître dans le Cockpit sous 24h (ou immédiatement
après un appel manuel de test).
