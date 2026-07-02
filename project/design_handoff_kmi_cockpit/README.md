# Handoff: KMI Cockpit — Multi-SaaS Metrics Dashboard

## Overview
KMI Cockpit is a control-tower dashboard that centralizes subscription metrics (MRR, subscribers, growth, churn) for several independent SaaS products. The container/chrome (sidebar, nav, period selector, cards, charts frames) has one **neutral, structural identity** shared by every product. Each SaaS keeps its own **brand accent color**, which is passed in as data and applied only to specific accents: card left-border, name badge, and the two charts that belong to that product (MRR trend line, "new vs churn" bar chart). No accent color is ever hardcoded — it always flows from the SaaS's data record.

## About the Design Files
The file in this bundle (`KMI Cockpit.dc.html`) is a **design reference** built as a single-file interactive HTML prototype (using an internal templating/component runtime — `{{ }}` placeholders, `<sc-for>`/`<sc-if>` loops — that only exists in the design tool). It is **not production code to copy as-is**. Your task is to **recreate this design in the target codebase's actual environment** (React, Vue, Svelte, native, etc.), following that codebase's existing component patterns, data-fetching approach, and design-token system — or, if no environment/design system exists yet, pick the most suitable stack and implement fresh.

Do treat the following as ground truth to reproduce exactly:
- Layout structure and spacing
- Color values (neutral system + the per-SaaS accent mechanism)
- Typography
- Chart geometry/behavior
- Interaction and state logic described below

## Fidelity
**High-fidelity.** Colors, type, spacing, and chart math are final. Copy is in French and should ship as-is (or be swapped for real product copy) — do not translate or rewrite it. Mock data is illustrative (3 fictional SaaS) — replace with real API data.

## Screens / Views

### 1. Overview ("Vue d'ensemble")
Purpose: at-a-glance comparison of every connected SaaS.

Layout:
- Two-column app shell: fixed 224px sidebar (left) + flexible main content (right), both `height: 100vh`, sidebar has `border-right: 1px solid` neutral border.
- Main content has a sticky-style top bar (20px/32px padding, bottom border) containing page title + subtitle on the left, period selector on the right.
- Below the top bar: a CSS grid, `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`, `gap: 18px`, `padding: 28px 32px 48px`.
- One card per SaaS.

Card component ("SaaS card"):
- Container: white surface, `1px solid` neutral border, **`border-left: 4px solid <saas.accent>`**, `border-radius: 10px`, `padding: 20px`, vertical flex with `gap: 14px`. Hover: `box-shadow: 0 4px 14px rgba(0,0,0,0.07)`. Whole card is clickable → navigates to that SaaS's detail view.
- Top row: name badge (pill) on the left, a `→` chevron affordance on the right.
  - Badge: `display:inline-flex`, `gap:7px`, background = `<saas.accentSoft>` (accent at ~12–14% alpha), text color = `<saas.accent>`, `padding:5px 10px`, `border-radius:100px`, `font-weight:600`, `font-size:12.5px`. Includes a 6×6px filled circle dot in the accent color before the name.
- Tagline: one-line product description, 11.5px, muted neutral text.
- MRR value: **IBM Plex Mono**, 30px, weight 600 — e.g. `13 120 €` (French thousands-separator formatting, currency suffix).
- Subscriber count line: `"{{count}} abonnés actifs"`, 12.5px, muted.
- Delta row: `▲ +7.7 % vs mois dernier` in green (`oklch(55% 0.15 145)`) if growth is positive, `▼` in red (`oklch(58% 0.19 25)`) if negative. This red/green is a **semantic status color**, not a brand accent — it never changes with the SaaS.

### 2. Detail view (on card click)
Purpose: drill into one SaaS's metrics.

Layout: single column, `gap: 22px`, same top-bar chrome as overview but with a back arrow (`←`) before the title, and the title/subtitle swapped for the SaaS's name/category.

Sections, top to bottom:

**a. Header row**
- Left: 11px accent-colored dot + SaaS name (22px/600) + tagline (12.5px muted) below it.
- Right: a neutral chip showing the flagship/reference plan, e.g. `Formule phare  Pro · 39 €/mois`. (For Vumos this is the Pro plan at 39 €/month, called out per product spec as the reference price point.)

**b. KPI row** — CSS grid `repeat(auto-fit, minmax(190px,1fr))`, gap 14px. Three neutral cards (no accent — these are cockpit instrumentation, not brand surfaces):
  1. **MRR actuel** — big mono value + delta (▲/▼ colored red/green) + period label (e.g. "12 derniers mois").
  2. **Abonnés actifs** — count + net new subscribers over the selected period (e.g. "Net +32 sur 12 derniers mois").
  3. **Taux de churn** — percentage + period label.

**c. MRR trend chart** ("Évolution du MRR")
  - Full-width card containing an SVG line chart, `viewBox="0 0 680 220"`, responsive width, fixed 220px height.
  - 3 horizontal gridlines with compact y-axis labels (e.g. "8k €"), neutral border color, IBM Plex Mono 10px labels.
  - Optional filled area under the line using the SaaS's `accentSoft` color (a boolean toggle in the design; default on).
  - Line stroke = `<saas.accent>`, 2.5px, rounded caps/joins; a small filled dot at every data point.
  - X-axis labels: dates (dd/mm) for the 7-day/30-day views, short month names (French, e.g. "juil") for the 12-month view — only a subset shown (~6 evenly spaced) to avoid clutter.

**d. Plan distribution** ("Répartition par formule")
  - Card, `max-width: 560px`.
  - A single stacked horizontal bar, `height:14px`, `border-radius:7px`, segments sized by `flex: <pct>`, each segment colored `<saas.accent>` at decreasing opacity per plan tier: 100%, 62%, 34% (so the segments are visually distinguishable using only the one brand color).
  - Legend below: one row per plan — colored square swatch, plan name, price (`{{price}} €/mois`, muted), and right-aligned `{{count}} · {{pct}}%`.

**e. New vs. churn chart** ("Nouveaux vs résiliations")
  - Full-width card, grouped bar chart, SVG `viewBox="0 0 680 170"`.
  - Legend at top-right: colored square + "Nouveaux" (in `<saas.accent>`) and colored square + "Résiliations" (in a fixed **neutral** gray, `oklch(58% 0 0)`, used identically across all SaaS — churn is never shown in the brand color).
  - Two bars per period bucket (day, 5-day bucket, or month depending on selected period), baseline gridline, x-axis labels under ~6 of the bars.

## Interactions & Behavior
- **Sidebar nav**: "Vue d'ensemble" link + one entry per connected SaaS (small accent-colored dot + name). Clicking a SaaS entry jumps straight to its detail view. The active entry gets a neutral hover/active background (`theme.surfaceHover`) — never an accent background.
- **Card click** (overview) → opens that SaaS's detail view.
- **Back arrow** (top bar, detail view only) and **"Vue d'ensemble" sidebar link** → return to overview.
- **Period selector** (top bar, segmented control: `7 j` / `30 j` / `12 mois`): global state. Drives the granularity and comparison window of the MRR trend chart, the new-vs-churn chart, and the three detail KPIs (MRR delta, net new subscribers, churn rate). The overview cards are NOT affected by this selector — their "vs mois précédent" delta is always month-over-month, as originally specced. Active segment gets a white pill background + subtle shadow; inactive segments are transparent with muted text.
- No dark mode (removed per revision) — the dashboard is light-theme only.
- No "latest subscribers" list (removed per revision) — the detail view ends after the new-vs-churn chart.
- Hover states: cards lift with a soft shadow; sidebar buttons and nav items get a neutral hover background; there is no hover state that introduces an accent color anywhere in the neutral chrome.

## State Management
Minimal client state:
- `period`: `'7j' | '30j' | '12m'` — global, defaults to `'12m'`.
- `selected`: `string | null` — id of the currently viewed SaaS, or `null` for overview.
- Everything else (theme tokens, chart geometry, formatted labels, KPI deltas) is **derived**, recomputed from the current SaaS's raw metrics + the selected period every render. No other UI state.

### Data model (per SaaS — this is what a real API should return)
```
{
  id, name, tagline, category,
  accentColor: string,       // e.g. "oklch(58% 0.19 300)" or any CSS color — THE per-brand accent, data-driven
  featuredPlan: string,      // name of the plan to spotlight in the header chip
  plans: [{ name, price, subscriberCount }],
  mrr: number,                // current total MRR (= sum of plan price × plan subscriber count)
  subscribers: number,        // current total active subscribers
  mrrHistory: {                // time series, oldest → newest
    daily: number[],          // last 60 days of total active MRR (used for 7j/30j windows)
    monthly: number[]          // last 12 months of total active MRR
  },
  flows: {
    daily:   { new: number[], churn: number[] },   // subscriber counts added/lost per day, 60 entries
    monthly: { new: number[], churn: number[] }     // per month, 12 entries
  }
}
```
Notes for the real implementation:
- `mrr` should equal `Σ(plan.price × plan.subscriberCount)` — keep these consistent.
- The "30 j" chart view buckets the last 30 daily points into 6 buckets of ~5 days each (averaged for MRR, summed for new/churn) for readability; "7 j" shows the 7 raw daily points; "12 mois" uses the monthly series directly.
- MRR delta (KPI + card) = `(end − start) / start` over the series slice for the selected window. Overview card delta is always last-month vs. previous-month regardless of the global period selector.
- Churn rate = `Σ(churn over window) / current total subscribers × 100`. (Earlier draft divided by a "start-of-period" estimate, which could blow up when net-new ≈ total subscribers — use current total subscribers as the stable denominator.)
- Net new (KPI) = `Σnew − Σchurn` over the selected window.

## Design Tokens

### Neutral container palette (the Cockpit "chrome" — same regardless of which SaaS is shown)
- Background: `oklch(98% 0.003 250)`
- Surface (cards, sidebar, top bar): `oklch(100% 0 0)` (pure white)
- Surface hover: `oklch(95% 0.004 250)`
- Border: `oklch(89% 0.005 250)`
- Text (primary): `oklch(20% 0.005 250)`
- Text (muted/secondary): `oklch(46% 0.01 250)`
- Chip/pill background (period selector track): `oklch(94% 0.005 250)`

### Semantic status colors (not brand — used only for delta arrows)
- Positive/growth: `oklch(55% 0.15 145)` (green)
- Negative/decline: `oklch(58% 0.19 25)` (red)
- Churn bars (neutral, same across every SaaS): `oklch(58% 0 0)`

### Per-SaaS accent tokens (data-driven — example values used in mocks)
- Vumos: `oklch(58% 0.19 300)` (violet), soft/badge variant `oklch(58% 0.19 300 / 0.12)`
- Ledgerly: `oklch(58% 0.15 200)` (teal), soft variant `oklch(58% 0.15 200 / 0.12)`
- Roost: `oklch(65% 0.17 55)` (amber), soft variant `oklch(65% 0.17 55 / 0.14)`
- Plan-distribution segment colors = the SaaS accent at 100%, 62%, 34% opacity (in tier order).
- "Soft" variant = same accent at ~12–14% alpha; used for badge backgrounds and chart area fill.

### Typography
- UI text: **IBM Plex Sans** (400/500/600/700), loaded from Google Fonts.
- Numbers/metrics/timestamps/chart labels: **IBM Plex Mono** (400/500/600) — used for every MRR figure, KPI value, axis label, and date, to read as "instrumentation."
- Scale used: 11–12.5px (muted/meta text), 13–15px (body/buttons), 17–19px (section titles), 22px (SaaS name in detail header), 30px (MRR figure on cards).

### Spacing / shape
- Sidebar width: 224px. Top bar padding: 20px/32px. Content padding: 28px/32px/48px.
- Card radius: 10px. Pill/badge radius: 100px (full). Chip radius: 8px.
- Grid gaps: 18px (cards), 14px (KPI row), 10–16px (internal card spacing).

## Assets
No external images/icons. All visuals are:
- CSS shapes (dots, pills, stacked bars) for badges/indicators.
- Hand-computed inline SVG for both charts (line chart + grouped bar chart) — geometry (padding, scaling, point/bar positions) is fully specified in the source file's chart-building logic and should be re-implemented with a charting library (e.g. Recharts, Chart.js, Visx) or equivalent custom SVG in the target stack, driven by the accent color and data model above.
- Google Fonts: IBM Plex Sans + IBM Plex Mono (`https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600`).

## Files
- `KMI Cockpit.dc.html` — the full interactive prototype (overview + detail views, period switching, mock data generation for 3 SaaS). Read this for exact pixel values, hover states, and the chart-geometry math (search for `buildLineChart` / `buildBarChart` / `buildDetail` in the embedded script) if anything above is ambiguous.
