import type { ReactNode } from 'react';
import { Card } from 'react-bootstrap';

interface Props {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'muted';
}

/** Summary indicator. `muted` tone is used when the value is unavailable. */
export default function KpiCard({ label, value, hint, tone = 'default' }: Props) {
  return (
    <Card className={`kpi-card h-100 ${tone === 'muted' ? 'kpi-muted' : ''}`} as="section" aria-label={label}>
      <Card.Body>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {hint && <div className="kpi-hint">{hint}</div>}
      </Card.Body>
    </Card>
  );
}
