import type { Metric } from '../../types';
import { fmtPct } from '../../utils/format';

/** Percentage with a dagger when the figure is as-reported by the source rather than computed here. */
export default function ShareCell({ metric, digits = 2 }: { metric: Metric; digits?: number }) {
  if (metric.value === null) return <span className="text-muted">Unavailable</span>;
  return (
    <span>
      {fmtPct(metric.value, digits)}
      {metric.basis === 'reported' && <sup title="As reported by the source; total votes not available to compute it"> †</sup>}
    </span>
  );
}
