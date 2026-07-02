# KMI Cockpit

Tour de contrôle multi-SaaS : centralise les métriques (MRR, abonnés, croissance, churn) de
plusieurs SaaS indépendants dans un seul dashboard, chacun gardant sa propre couleur d'accent
(transmise en donnée, jamais codée en dur).

## Architecture

- **`kmi-cockpit-hub`** — projet Supabase dédié (séparé du projet de chaque SaaS), tables
  `saas_apps`, `metrics_snapshots`, `api_keys`.
- **Edge Function `ingest-metrics`** — reçoit un POST authentifié par `X-API-Key` depuis
  n'importe quel SaaS externe et upsert un snapshot quotidien. Voir
  `supabase/functions/ingest-metrics` côté projet Supabase (déployée via MCP, code source dans
  l'historique de session — redéployable avec `supabase functions deploy ingest-metrics`).
- **Front Next.js** (App Router, Server Components) — authentification Supabase Auth
  email/password (utilisateur unique), vue d'ensemble + vue détaillée par SaaS avec graphiques
  Recharts (courbe MRR, camembert répartition par formule, barres nouveaux vs churn), tous
  teintés par `saas.accent_color`.
- **`scripts/push-metrics-example/`** — script à adapter et déployer comme Edge Function
  planifiée quotidienne dans le projet Supabase de chaque SaaS, pour pousser ses métriques vers
  le Hub.

## Développement local

```bash
npm install
npm run dev
```

Variables d'environnement requises (`.env.local`, non commité) :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

## Authentification

Compte unique. Créez-le via le dashboard Supabase du projet `kmi-cockpit-hub`
(Authentication → Users → Add user), puis connectez-vous sur `/login`.

## Déploiement

```bash
vercel deploy
```

Les variables `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sont
définies dans `vercel.json` (valeurs publiques, protégées par RLS côté Supabase — pas de
secret exposé).

## Ajouter un nouveau SaaS

1. `insert into saas_apps (name, slug, accent_color, tagline, category, featured_plan) values (...)`
2. Générer une clé API, en insérer le hash SHA-256 dans `api_keys`, transmettre la clé en clair
   au SaaS une seule fois.
3. Adapter et déployer `scripts/push-metrics-example` dans le projet Supabase de ce SaaS.

## Origine du design

`project/` contient le bundle de handoff Claude Design d'origine (prototype HTML, transcript de
conversation) qui a servi de référence pixel-perfect pour la palette neutre, la logique d'accent
par SaaS et la géométrie des graphiques.
