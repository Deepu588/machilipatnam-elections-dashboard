import { useMemo } from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../components/common/ChartCard';
import DataTable, { type Column } from '../components/common/DataTable';
import KpiCard from '../components/common/KpiCard';
import PartyBadge from '../components/common/PartyBadge';
import ShareCell from '../components/common/ShareCell';
import SourceNote from '../components/common/SourceNote';
import StatusMessage from '../components/common/StatusMessage';
import { useDashboardData } from '../context/DataContext';
import { useFilters, type AcYear } from '../context/FilterContext';
import { partiesIn, partyShareSeries, summarizeElection, type ElectionSummary } from '../utils/calculations';
import { partyColor } from '../utils/constants';
import { fmtInt } from '../utils/format';

interface CompareRow extends ElectionSummary { acName: string; acId: number }

export default function AssemblyPage() {
  const { assembly } = useDashboardData();
  const { acId, setAcId, acYear, setAcYear } = useFilters();
  const acs = assembly.constituencies;
  const ac = acs.find((a) => a.id === acId) ?? acs[0];
  const allYears = useMemo(() => [...new Set(acs.flatMap((a) => a.elections.map((e) => e.year)))].sort(), [acs]);

  if (!ac) return <StatusMessage kind="empty" message="No Assembly constituency data is available." />;

  const elections = ac.elections.filter((e) => acYear === 'all' || e.year === acYear);
  const summaries = elections.map(summarizeElection);
  const latest = summaries[summaries.length - 1];
  const parties = partiesIn(ac.elections);
  const shareRows = partyShareSeries(elections, parties.filter((p) => elections.some((e) => e.candidates.some((c) => c.party === p))));
  const singleYear = acYear === 'all' ? null : elections[0];

  const columns: Column<ElectionSummary>[] = [
    { key: 'year', header: 'Year', accessor: (r) => r.year },
    { key: 'winner', header: 'Winner', accessor: (r) => r.winner?.name ?? null },
    { key: 'party', header: 'Party', accessor: (r) => r.winner?.party ?? null, render: (r) => (r.winner ? <PartyBadge party={r.winner.party} /> : '—') },
    { key: 'votes', header: 'Votes', align: 'end', accessor: (r) => r.winner?.votes ?? null, render: (r) => fmtInt(r.winner?.votes) },
    { key: 'share', header: 'Vote share', align: 'end', accessor: (r) => r.winnerShare.value, render: (r) => <ShareCell metric={r.winnerShare} /> },
    { key: 'ru', header: 'Runner-up', accessor: (r) => r.runnerUp?.name ?? null, render: (r) => (r.runnerUp ? <>{r.runnerUp.name} <PartyBadge party={r.runnerUp.party} /></> : '—') },
    { key: 'margin', header: 'Margin (votes)', align: 'end', accessor: (r) => r.marginVotes, render: (r) => fmtInt(r.marginVotes) },
    { key: 'marginPct', header: 'Margin (%)', align: 'end', accessor: (r) => r.marginPct.value, render: (r) => <ShareCell metric={r.marginPct} /> },
  ];

  // Cross-segment comparison for one year (latest year when the filter is "all")
  const compareYear = acYear === 'all' ? allYears[allYears.length - 1] : acYear;
  const compareRows: CompareRow[] = acs.map((a) => {
    const e = a.elections.find((x) => x.year === compareYear);
    const s = summarizeElection(e ?? { year: compareYear, totalVotes: null, reportedTurnoutPct: null, candidates: [] });
    return { ...s, acName: a.name, acId: a.id };
  });
  const compareCols: Column<CompareRow>[] = [
    { key: 'ac', header: 'Assembly constituency', accessor: (r) => r.acName },
    { key: 'party', header: 'Winning party', accessor: (r) => r.winner?.party ?? null, render: (r) => (r.winner ? <PartyBadge party={r.winner.party} /> : <span className="text-muted">No result available</span>) },
    { key: 'share', header: 'Winner share', align: 'end', accessor: (r) => r.winnerShare.value, render: (r) => <ShareCell metric={r.winnerShare} /> },
    { key: 'margin', header: 'Margin (votes)', align: 'end', accessor: (r) => r.marginVotes, render: (r) => fmtInt(r.marginVotes) },
    { key: 'marginPct', header: 'Margin (%)', align: 'end', accessor: (r) => r.marginPct.value, render: (r) => <ShareCell metric={r.marginPct} /> },
  ];

  return (
    <>
      <header className="page-header">
        <h1>Assembly constituency explorer</h1>
        <p>Choose a segment and an election year. Results are for the Andhra Pradesh Legislative Assembly elections.</p>
      </header>

      <section className="panel mb-4" aria-label="Filters">
        <Row className="g-3">
          <Col md={6}>
            <Form.Group controlId="ac-select">
              <Form.Label>Assembly constituency</Form.Label>
              <Form.Select value={ac.id} onChange={(e) => setAcId(Number(e.target.value))}>
                {acs.map((a) => <option key={a.id} value={a.id}>{a.id} – {a.name}{a.reservation !== 'GEN' ? ` (${a.reservation})` : ''}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="ac-year">
              <Form.Label>Election year</Form.Label>
              <Form.Select value={String(acYear)} onChange={(e) => setAcYear((e.target.value === 'all' ? 'all' : Number(e.target.value)) as AcYear)}>
                <option value="all">All years</option>
                {allYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </section>

      <Row className="g-3 mb-4" as="section" aria-label={`${ac.name} indicators`}>
        <Col xs={6} lg={3}><KpiCard label="Segment" value={`${ac.id} · ${ac.name}`} hint={ac.reservation === 'SC' ? 'SC-reserved' : 'General'} /></Col>
        <Col xs={6} lg={3}><KpiCard label="Electors (2019)" value={fmtInt(ac.electors2019)} hint={ac.mandals.join(', ')} /></Col>
        <Col xs={6} lg={3}><KpiCard label={latest ? `Winner ${latest.year}` : 'Winner'} value={latest?.winner ? <span className="kpi-name">{latest.winner.name}</span> : 'No result available'} hint={latest?.winner?.party} tone={latest?.winner ? 'default' : 'muted'} /></Col>
        <Col xs={6} lg={3}><KpiCard label="Margin of victory" value={latest ? fmtInt(latest.marginVotes) : 'Unavailable'} hint={latest ? `${latest.year}` : undefined} tone={latest ? 'default' : 'muted'} /></Col>
      </Row>

      {summaries.length === 0 ? (
        <StatusMessage kind="empty" message={`No result is available for ${ac.name} in ${acYear}. Try another year or "All years".`} />
      ) : (
        <>
          <Row className="g-3 mb-4">
            <Col lg={6}>
              {singleYear ? (
                <ChartCard title={`${ac.name}: candidates in ${singleYear.year}`} subtitle="Votes received (number of votes)" source="Wikipedia / ECI (see Sources)">
                  <BarChart data={singleYear.candidates.map((c) => ({ name: c.name.split(' ').slice(0, 2).join(' '), votes: c.votes, party: c.party }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                    <YAxis tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v: number) => fmtInt(v)} />
                    <Bar dataKey="votes" name="Votes">
                      {singleYear.candidates.map((c) => <Cell key={c.name} fill={partyColor(c.party)} />)}
                    </Bar>
                  </BarChart>
                </ChartCard>
              ) : (
                <ChartCard title={`${ac.name}: party vote share by year`} subtitle="Share of votes (%); shares marked † in the table are as reported" source="Wikipedia / ECI (see Sources)">
                  <BarChart data={shareRows}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" />
                    <YAxis unit="%" domain={[0, 100]} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                    <Legend />
                    {parties.filter((p) => shareRows.some((r) => r[p] !== null && r[p] !== undefined)).map((p) => <Bar key={p} dataKey={p} fill={partyColor(p)} radius={[3, 3, 0, 0]} />)}
                  </BarChart>
                </ChartCard>
              )}
            </Col>
            <Col lg={6}>
              <ChartCard
                title={`Winning margin by segment, ${compareYear}`}
                subtitle="Votes; bar colour = winning party"
                source="Wikipedia / ECI (see Sources)"
                isEmpty={compareRows.every((r) => r.marginVotes === null)}
                emptyMessage={`No segment results available for ${compareYear}.`}
              >
                <BarChart data={compareRows.map((r) => ({ name: r.acName, margin: r.marginVotes, party: r.winner?.party ?? '' }))} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmtInt(v)} />
                  <Bar dataKey="margin" name="Margin (votes)">
                    {compareRows.map((r) => <Cell key={r.acId} fill={partyColor(r.winner?.party ?? '')} />)}
                  </Bar>
                </BarChart>
              </ChartCard>
            </Col>
          </Row>

          <section className="panel mb-4">
            <h2 className="panel-title">{ac.name}: results {acYear === 'all' ? 'by year' : `in ${acYear}`}</h2>
            <DataTable caption={`${ac.name} results`} columns={columns} rows={summaries} rowKey={(r) => String(r.year)} pageSize={6} />
            {elections.filter((e) => e.note).map((e) => <p key={e.year} className="source-note">Note {e.year}: {e.note}</p>)}
            <p className="source-note">† as reported by the source because total votes are unavailable for that election.</p>
          </section>

          <section className="panel mb-4">
            <h2 className="panel-title">Compare all segments, {compareYear}</h2>
            <DataTable caption={`All segments, ${compareYear}`} columns={compareCols} rows={compareRows} rowKey={(r) => String(r.acId)} searchable pageSize={7} />
            {acYear === 'all' && <p className="source-note">Showing the latest year because "All years" is selected.</p>}
            <SourceNote sources={assembly.sources.slice(0, 7)} />
          </section>
        </>
      )}
    </>
  );
}
