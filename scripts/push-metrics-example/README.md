# push-metrics — script à déployer dans chaque SaaS

Edge Function planifiée quotidienne à copier dans le projet Supabase de
**chaque SaaS** (pas dans `kmi-cockpit-hub`). Elle calcule les métriques du
jour et les pousse vers `ingest-metrics` sur le Hub. Deux variantes :

- **`index-stripe.ts` (recommandé pour Vumos)** — lit directement l'API
  Stripe (abonnements actifs, formules, résiliations du jour). Ne nécessite
  aucune connaissance du schéma interne de la base Vumos, juste une clé
  Stripe. C'est la version prête à l'emploi si Vumos facture via Stripe.
- **`index.ts`** — exemple générique interrogeant des tables internes
  (`subscriptions` / `subscription_events`) à adapter au schéma réel, pour
  les SaaS qui ne passent pas (ou pas uniquement) par Stripe.

## 1. Adapter si besoin

Pour `index-stripe.ts` : rien à adapter si un abonnement Stripe = une seule
ligne de prix (cas standard). S'il y a plusieurs lignes par abonnement,
ajuster `monthlyAmountForSub` pour sommer tous les `items.data`.

Pour `index.ts` : la fonction `computeTodayMetrics` contient une requête
générique en supposant des tables `subscriptions` / `subscription_events`.
Remplacez-la par les requêtes correspondant au schéma réel du SaaS.

Le format de sortie attendu par le Hub est fixe dans les deux cas :

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

Option dashboard (pas de CLI) : **Edge Functions → Deploy a new function**,
nomme-la `push-metrics`, colle le contenu de `index-stripe.ts` (ou `index.ts`).

Option CLI :
```bash
supabase functions deploy push-metrics --project-ref <ref-du-projet-du-saas>
```

## 3. Configurer les secrets (dans le projet du SaaS, pas le Hub)

Dashboard : **Project Settings → Edge Functions → Secrets**. CLI :

```bash
supabase secrets set \
  STRIPE_SECRET_KEY="<clé Stripe restreinte lecture seule>" \
  HUB_INGEST_URL="https://owzlkqjtsgwbygxlwfnx.supabase.co/functions/v1/ingest-metrics" \
  HUB_API_KEY="<clé fournie par le Hub pour ce SaaS>" \
  --project-ref <ref-du-projet-du-saas>
```

`STRIPE_SECRET_KEY` n'est nécessaire que pour `index-stripe.ts` — utilise
idéalement une [clé restreinte](https://dashboard.stripe.com/apikeys) en
lecture seule sur *Subscriptions*, *Prices*, *Products* et *Events* (pas la
clé secrète complète, par prudence).

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectées automatiquement
par le runtime Edge Functions (utile seulement pour `index.ts`) — inutile de
les définir.

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
