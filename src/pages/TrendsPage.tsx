import { useMemo } from 'react';
import { Accordion, Col, Row, Table } from 'react-bootstrap';
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../components/common/ChartCard';
import DataTable, { type Column } from '../components/common/DataTable';
import PartyBadge from '../components/common/PartyBadge';
import ShareCell from '../components/common/ShareCell';
import StatusMessage from '../components/common/StatusMessage';
import YearFilter from '../components/common/YearFilter';
import { useDashboardData } from '../context/DataContext';
import { useFilters } from '../context/FilterContext';
import { partiesIn, partyShareSeries, summarizeElection, swing, type ElectionSummary } from '../utils/calculations';
import { partyColor } from '../utils/constants';
import { fmtInt, fmtSigned } from '../utils/format';

export default function TrendsPage() {
  const { parliament, assembly } = useDashboardData();
  const { pcYears, setPcYears } = useFilters();
  const allYears = parliament.elections.map((e) => e.year);
  const selected = useMemo(() => parliament.elections.filter((e) => pcYears.includes(e.year)), [parliament, pcYears]);
  const summaries = useMemo(() => selected.map(summarizeElection), [selected]);
  const parties = useMemo(() => partiesIn(selected), [selected]);
  const series = useMemo(() => partyShareSeries(selected, parties), [selected, parties]);

  const cols: Column<ElectionSummary>[] = [
    { key: 'year', header: 'Year', accessor: (r) => r.year },
    { key: 'total', header: 'Total votes counted', align: 'end', accessor: (r) => r.totalVotes, render: (r) => fmtInt(r.totalVotes) },
    { key: 'electors', header: 'Registered electors', align: 'end', accessor: (r) => r.electors, render: (r) => fmtInt(r.electors) },
    { key: 'turnout', header: 'Turnout', align: 'end', accessor: (r) => r.turnoutPct.value, render: (r) => <ShareCell metric={r.turnoutPct} /> },
    { key: 'share', header: 'Winner vote share', align: 'end', accessor: (r) => r.winnerShare.value, render: (r) => <ShareCell metric={r.winnerShare} /> },
    { key: 'margin', header: 'Margin (votes)', align: 'end', accessor: (r) => r.marginVotes, render: (r) => fmtInt(r.marginVotes) },
    { key: 'marginPct', header: 'Margin (%)', align: 'end', accessor: (r) => r.marginPct.value, render: (r) => <ShareCell metric={r.marginPct} /> },
  ];

  const first = series[0];
  const last = series[series.length - 1];
  const prev = series.length > 1 ? series[series.length - 2] : undefined;

  return (
    <>
      <header className="page-header">
        <h1>Electoral trends &amp; indicators</h1>
        <p>Calculated indicators, party performance over time and a segment-by-segment comparison. The year filter is shared with the Lok Sabha page.</p>
      </header>

      <section className="panel mb-4" aria-label="Filters">
        <YearFilter legend="Election years" years={allYears} selected={pcYears} onChange={setPcYears} />
      </section>

      <section className="panel mb-4">
        <h2 className="panel-title">Formulas used</h2>
        <Accordion defaultActiveKey="f">
          <Accordion.Item eventKey="f">
            <Accordion.Header>How each indicator is calculated</Accordion.Header>
            <Accordion.Body>
              <ul className="formula-list">
                <li><strong>Vote share (%)</strong> = candidate votes ÷ total votes counted × 100. Denominator: total votes counted as listed by the source.</li>
                <li><strong>Winning margin (votes)</strong> = winner’s votes − runner-up’s votes. NOTA is never treated as a winner or runner-up.</li>
                <li><strong>Winning margin (%)</strong> = margin ÷ total votes counted × 100.</li>
                <li><strong>Turnout (%)</strong> = votes polled ÷ registered electors × 100. Electors are only available for 2019; other years use the turnout printed by the source (marked †).</li>
                <li><strong>Change in vote share</strong> = later election share − earlier election share, in percentage points (pp).</li>
              </ul>
              <p className="mb-0 small text-muted">
                These are aggregate results. They describe how a constituency voted overall and say nothing about how any individual voted.
                Figures marked † are as printed by the source because the denominator is missing.
              </p>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </section>

      {selected.length === 0 ? (
        <StatusMessage kind="empty" message="No election year selected. Choose at least one year above." />
      ) : (
        <>
          <section className="panel mb-4">
            <h2 className="panel-title">Parliamentary indicators by year</h2>
            <DataTable caption="Parliamentary indicators" columns={cols} rows={summaries} rowKey={(r) => String(r.year)} pageSize={6} />
          </section>

          <Row className="g-3 mb-4">
            <Col lg={7}>
              <ChartCard title="Party vote share trend" subtitle="Lok Sabha vote share (%) by election year; gaps mean the party is not listed" source="ECI results via Wikipedia" isEmpty={series.length === 0}>
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                  {parties.map((p) => <Line key={p} dataKey={p} stroke={partyColor(p)} strokeWidth={2} connectNulls dot />)}
                </LineChart>
              </ChartCard>
            </Col>
            <Col lg={5}>
              <section className="panel h-100">
                <h2 className="panel-title">Party performance change</h2>
                <div className="table-scroll">
                  <Table size="sm" className="mb-0">
                    <caption className="visually-hidden">Change in vote share between elections</caption>
                    <thead>
                      <tr>
                        <th scope="col">Party</th>
                        <th scope="col" className="text-end">{first?.year}</th>
                        <th scope="col" className="text-end">{last?.year}</th>
                        <th scope="col" className="text-end">Change</th>
                        {prev && prev !== first && <th scope="col" className="text-end">vs {prev.year}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {parties.map((p) => (
                        <tr key={p}>
                          <td><PartyBadge party={p} /></td>
                          <td className="text-end">{first?.[p] == null ? '—' : `${first[p]}%`}</td>
                          <td className="text-end">{last?.[p] == null ? '—' : `${last[p]}%`}</td>
                          <td className="text-end">{series.length > 1 ? fmtSigned(swing(first?.[p], last?.[p])) : '—'}</td>
                          {prev && prev !== first && <td className="text-end">{fmtSigned(swing(prev[p], last?.[p]))}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                <p className="source-note">“—” means the party was not among the candidates listed in the source that year.</p>
              </section>
            </Col>
          </Row>
        </>
      )}

      <section className="panel mb-4">
        <h2 className="panel-title">Assembly-level comparison: winning party and margin</h2>
        <div className="table-scroll">
          <Table size="sm" className="mb-2 matrix">
            <caption className="visually-hidden">Winning party and margin percentage for each Assembly segment and year</caption>
            <thead><tr><th scope="col">Segment</th>{pcYears.map((y) => <th key={y} scope="col">{y}</th>)}</tr></thead>
            <tbody>
              {assembly.constituencies.map((a) => (
                <tr key={a.id}>
                  <th scope="row">{a.name}</th>
                  {pcYears.map((y) => {
                    const e = a.elections.find((x) => x.year === y);
                    if (!e) return <td key={y} className="text-muted">No data</td>;
                    const s = summarizeElection(e);
                    return (
                      <td key={y}>
                        {s.winner ? <PartyBadge party={s.winner.party} /> : '—'}
                        <div className="small text-muted"><ShareCell metric={s.marginPct} digits={1} /></div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <p className="source-note">Assembly Election results; the second line is the winning margin as % of votes († = as reported). Segment-wise Lok Sabha votes were not collected.</p>
      </section>
    </>
  );
}
