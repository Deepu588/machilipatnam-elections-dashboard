import type { ReactNode } from 'react';
import { Card } from 'react-bootstrap';
import { ResponsiveContainer } from 'recharts';
import StatusMessage from './StatusMessage';

interface Props {
  title: string;
  subtitle?: string;
  source?: string;
  height?: number;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode; // a single Recharts chart element
}

/** Titled card wrapper for every chart: title, unit/subtitle, responsive area, data-source line, empty state. */
export default function ChartCard({ title, subtitle, source, height = 300, isEmpty, emptyMessage, children }: Props) {
  return (
    <Card className="chart-card h-100" as="figure" role="group" aria-label={title}>
      <Card.Body>
        <figcaption>
          <h3 className="chart-title">{title}</h3>
          {subtitle && <div className="chart-subtitle">{subtitle}</div>}
        </figcaption>
        {isEmpty ? (
          <StatusMessage kind="empty" message={emptyMessage ?? 'No data available for this selection.'} />
        ) : (
          <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer>
          </div>
        )}
        {source && <div className="chart-source">Data: {source}</div>}
      </Card.Body>
    </Card>
  );
}
