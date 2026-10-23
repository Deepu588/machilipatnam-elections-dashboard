import { Badge, Col, Row, Table } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../components/common/ChartCard';
import DataTable, { type Column } from '../components/common/DataTable';
import KpiCard from '../components/common/KpiCard';
import PartyBadge from '../components/common/PartyBadge';
import ShareCell from '../components/common/ShareCell';
import SourceNote from '../components/common/SourceNote';
import { useDashboardData } from '../context/DataContext';
import type { AssemblyConstituency } from '../types';
import { summarizeAll } from '../utils/calculations';
import { fmtInt, UNAVAILABLE } from '../utils/format';

export default function OverviewPage() {
  const { constituency: c, parliament, assembly } = useDashboardData();
  const summaries = summarizeAll(parliament.elections);
  const latest = summaries[summaries.length - 1];
  const acs = assembly.constituencies;
  const acElectorSum = acs.every((a) => a.electors2019 !== null) ? acs.reduce((s, a) => s + (a.electors2019 ?? 0), 0) : null;
  const pcElectors = c.electors.value;

  const columns: Column<AssemblyConstituency>[] = [
    { key: 'id', header: 'No.', accessor: (r) => r.id },
    { key: 'name', header: 'Assembly constituency', accessor: (r) => r.name },
    { key: 'res', header: 'Category', accessor: (r) => r.reservation, render: (r) => (r.reservation === 'GEN' ? 'General' : r.reservation) },
    { key: 'mandals', header: 'Mandals covered', accessor: (r) => r.mandals.join(', ') },
    { key: 'electors', header: 'Electors (2019)', accessor: (r) => r.electors2019, align: 'end', render: (r) => fmtInt(r.electors2019) },
    {
      key: 'share', header: '% of PC electors', align: 'end',
      accessor: (r) => (r.electors2019 !== null && acElectorSum ? (r.electors2019 / acElectorSum) * 100 : null),
      render: (r) => (r.electors2019 !== null && acElectorSum ? `${((r.electors2019 / acElectorSum) * 100).toFixed(1)}%` : UNAVAILABLE),
    },
  ];

  return (
    <>
      <header className="page-header">
        <h1>{c.name} Lok Sabha constituency</h1>
        <p>PC No. {c.number}, {c.state} · {c.districts} · {c.category}</p>
      </header>

      <Row className="g-3 mb-4" as="section" aria-label="Key indicators">
        <Col xs={6} lg={3}><KpiCard label={`Registered electors (${c.electors.referenceYear ?? 'year n/a'})`} value={fmtInt(pcElectors)} hint="Lok Sabha 2019 roll" tone={pcElectors === null ? 'muted' : 'default'} /></Col>
        <Col xs={6} lg={3}><KpiCard label="Assembly segments" value={acs.length} hint={`${acs.filter((a) => a.reservation === 'SC').length} SC-reserved`} /></Col>
        <Col xs={6} lg={3}>
          <KpiCard label={`Sitting MP (${c.currentMp.since})`} value={<span className="kpi-name">{c.currentMp.name}</span>} hint={`Party: ${c.currentMp.party}`} />
        </Col>
        <Col xs={6} lg={3}>
          <KpiCard
            label={`Turnout ${latest?.year ?? ''}`}
            value={latest ? <ShareCell metric={latest.turnoutPct} /> : UNAVAILABLE}
            hint={latest ? `Winning margin ${fmtInt(latest.marginVotes)} votes` : undefined}
          />
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={5}>
          <section className="panel h-100">
            <h2 className="panel-title">About the constituency</h2>
            <dl className="facts">
              <dt>Name / number</dt><dd>{c.name} / {c.number}</dd>
              <dt>State</dt><dd>{c.state}</dd>
              <dt>Districts</dt><dd>{c.districts}</dd>
              <dt>Coverage</dt><dd>{c.coverage}</dd>
              <dt>Sitting MP</dt><dd>{c.currentMp.name} <PartyBadge party={c.currentMp.party} /></dd>
              <dt>Sum of segment electors</dt>
              <dd>{fmtInt(acElectorSum)} <span className="text-muted">(25 Mar 2019 roll)</span></dd>
            </dl>
            <SourceNote sources={c.sources.slice(0, 2)}>{c.electors.note}</SourceNote>
          </section>
        </Col>
        <Col lg={7}>
          <ChartCard
            title="Electors by Assembly segment"
            subtitle="Registered electors, 25 March 2019 (number of voters)"
            source="CEO Andhra Pradesh, Electors Summary 25.03.2019"
            isEmpty={acs.length === 0}
          >
            <BarChart data={acs.map((a) => ({ name: a.name, electors: a.electors2019 }))} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} label={{ value: 'Electors', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(v: number) => fmtInt(v)} />
              <Bar dataKey="electors" name="Electors (2019)" fill="#2b7a84" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartCard>
        </Col>
      </Row>

      <section className="panel mb-4">
        <h2 className="panel-title">Assembly constituencies within {c.name}</h2>
        <DataTable caption="Assembly constituencies" columns={columns} rows={acs} rowKey={(r) => String(r.id)} searchable pageSize={7} />
      </section>

      <section className="panel mb-4">
        <h2 className="panel-title">Demographic indicators</h2>
        <p className="text-muted small">
          Reference year: 2011 Census. Parliamentary-constituency level tables are not published by the Census, so these fields are
          shown as unavailable rather than estimated.
        </p>
        <div className="table-scroll">
          <Table size="sm" className="mb-2">
            <caption className="visually-hidden">Demographic indicators</caption>
            <thead><tr><th scope="col">Indicator</th><th scope="col">Value</th><th scope="col">Reference year</th><th scope="col">Status</th></tr></thead>
            <tbody>
              {Object.entries(c.demographics).map(([key, d]) => (
                <tr key={key}>
                  <td>{d.label ?? key}</td>
                  <td>{d.value === null ? UNAVAILABLE : `${fmtInt(d.value)} ${d.unit ?? ''}`}</td>
                  <td>{d.referenceYear ?? UNAVAILABLE}</td>
                  <td>{d.value === null ? <Badge bg="secondary" title={d.note}>Not available</Badge> : <Badge bg="success">Available</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </section>
    </>
  );
}
