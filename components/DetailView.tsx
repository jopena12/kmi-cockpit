import { fmtAmount } from '@/lib/format';
import type { Detail } from '@/lib/metrics';
import type { SaasApp } from '@/lib/types';
import { churnColor } from '@/lib/theme';
import { MrrTrendChart } from './MrrTrendChart';
import { NewVsChurnChart } from './NewVsChurnChart';
import { PlanDistributionChart } from './PlanDistributionChart';

interface DetailViewProps {
  saas: SaasApp;
  detail: Detail;
}

export function DetailView({ saas, detail }: DetailViewProps) {
  return (
    <div className="detail">
      <div className="detail-header">
        <div className="detail-header-left">
          <span className="detail-dot" style={{ background: saas.accentColor }} />
          <div>
            <div className="detail-name">{saas.name}</div>
            {saas.tagline && <div className="detail-tagline">{saas.tagline}</div>}
          </div>
        </div>
        {saas.featuredPlan && (
          <div className="detail-chip">
            <span className="detail-chip-label">Formule phare</span>
            <span className="detail-chip-value">
              {saas.featuredPlan}
              {(() => {
                const plan = detail.planDist.find((p) => p.name === saas.featuredPlan);
                return plan ? ` · ${plan.price} €/mois` : '';
              })()}
            </span>
          </div>
        )}
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">MRR actuel</div>
          <div className="kpi-value mono">{fmtAmount(detail.kpiMrr, detail.currency)}</div>
          <div className="kpi-sub">
            <span className={detail.kpiMrrDeltaPositive ? 'kpi-delta--positive' : 'kpi-delta--negative'}>
              {detail.kpiMrrDeltaPositive ? '▲' : '▼'} {detail.kpiMrrDelta}
            </span>
            <span> · {detail.periodLabel}</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Abonnés actifs</div>
          <div className="kpi-value mono">{detail.kpiSubs}</div>
          <div className="kpi-sub">
            Net {detail.kpiNetNew} sur {detail.periodLabel}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Taux de churn</div>
          <div className="kpi-value mono">{detail.kpiChurn}</div>
          <div className="kpi-sub">{detail.periodLabel}</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-header">
          <div className="chart-card-title">Évolution du MRR</div>
          <div className="chart-card-meta">{detail.periodLabel}</div>
        </div>
        <MrrTrendChart data={detail.lineChart} accent={saas.accentColor} currency={detail.currency} />
      </div>

      <div className="chart-card plan-card">
        <div className="chart-card-title" style={{ marginBottom: 4 }}>
          Répartition par formule
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <PlanDistributionChart segments={detail.planDist} />
          <div className="plan-legend" style={{ flex: 1, marginTop: 0 }}>
            {detail.planDist.map((p) => (
              <div key={p.name} className="plan-legend-row">
                <div className="plan-legend-left">
                  <span className="plan-legend-swatch" style={{ background: p.color }} />
                  <span>{p.name}</span>
                  <span className="plan-legend-price">{p.price} €/mois</span>
                </div>
                <div className="plan-legend-count mono">
                  {p.count} · {p.pct}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-header">
          <div className="chart-card-title">Nouveaux vs résiliations</div>
          <div className="chart-legend">
            <span className="chart-legend-item">
              <span className="chart-legend-swatch" style={{ background: saas.accentColor }} />
              Nouveaux
            </span>
            <span className="chart-legend-item">
              <span className="chart-legend-swatch" style={{ background: churnColor }} />
              Résiliations
            </span>
          </div>
        </div>
        <NewVsChurnChart data={detail.barChart} accent={saas.accentColor} />
      </div>
    </div>
  );
}
