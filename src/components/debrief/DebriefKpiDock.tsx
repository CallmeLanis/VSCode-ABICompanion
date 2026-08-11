import { LiveKPI } from '../motion';

interface DebriefKpiDockProps {
  investment: number;
  netProfit: number;
  roi: number;
}

export function DebriefKpiDock({ investment, netProfit, roi }: DebriefKpiDockProps) {
  return (
    <aside className="debrief-kpi-dock" aria-label="Live economy snapshot">
      <p className="debrief-kpi-dock-label">Live intel</p>
      <div className="debrief-kpi-strip debrief-kpi-strip--stacked p-3 bg-abi-bg rounded-lg border border-abi-border">
        <LiveKPI
          label="Invest"
          value={investment}
          format={(n) => `$${n.toLocaleString()}`}
        />
        <LiveKPI
          label="Net"
          value={netProfit}
          format={(n) => `${n >= 0 ? '+' : ''}$${n.toLocaleString()}`}
          tone={netProfit >= 0 ? 'positive' : 'negative'}
        />
        <LiveKPI
          label="ROI"
          value={roi}
          format={(n) => `${n.toFixed(1)}%`}
          tone={roi >= 0 ? 'positive' : 'negative'}
        />
      </div>
    </aside>
  );
}
