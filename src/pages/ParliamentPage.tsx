import { useMemo } from 'react';
import { Col, Form, Row, Table } from 'react-bootstrap';
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../components/common/ChartCard';
import DataTable, { type Column } from '../components/common/DataTable';
import PartyBadge from '../components/common/PartyBadge';
import ShareCell from '../components/common/ShareCell';
import SourceNote from '../components/common/SourceNote';
import StatusMessage from '../components/common/StatusMessage';
import YearFilter from '../components/common/YearFilter';
import { useDashboardData } from '../context/DataContext';
import { useFilters } from '../context/FilterContext';
import type { Metric } from '../types';
import { partiesIn, partyShareSeries, shareOf, summarizeElection, swing, type ElectionSummary } from '../utils/calculations';
import { partyColor } from '../utils/constants';
import { fmtInt, fmtSigned } from '../utils/format';

interface CandidateRow { id: string; year: number; name: string; party: string; votes: number; share: Metric; rank: number }

export default function ParliamentPage() {
  const { parliament } = useDashboardData();
  const { pcYears, setPcYears, compareA, compareB, setCompareA, setCompareB } = useFilters();
  const allYears = parliament.elections.map((e) => e.year);
  const selected = useMemo(() => parliament.elections.filter((e) => pcYears.includes(e.year)), [parliament, pcYears]);
  const summaries = useMemo(() => selected.map(summarizeElection), [selected]);
  const parties = useMemo(() => partiesIn(selected), [selected]);
  const shareRows = useMemo(() => partyShareSeries(selected, parties), [selected, parties]);

  const candidateRows: CandidateRow[] = useMemo(
    () =>
      selected.flatMap((e) =>
        [...e.candidates]
          .sort((a, b) => b.votes - a.votes)
          .map((c, i) => ({ id: `${e.year}-${c.name}`, year: e.year, name: c.name, party: c.party, votes: c.votes, share: shareOf(c, e.totalVotes), rank: i + 1 })),
      ),
    [selected],
  );

  const summaryCols: Column<ElectionSummary>[] = [
    { key: 'year', header: 'Year', accessor: (r) => r.year },
    { key: 'winner', header: 'Winner', accessor: (r) => r.winner?.name ?? null },
    { key: 'party', header: 'Party', accessor: (r) => r.winner?.party ?? null, render: (r) => (r.winner ? <PartyBadge party={r.winner.party} /> : '—') },
    { key: 'votes', header: 'Winner votes', align: 'end', accessor: (r) => r.winner?.votes ?? null, render: (r) => fmtInt(r.winner?.votes) },
    { key: 'share', header: 'Vote share', align: 'end', accessor: (r) => r.winnerShare.value, render: (r) => <ShareCell metric={r.winnerShare} /> },
    { key: 'margin', header: 'Margin (votes)', align: 'end', accessor: (r) => r.marginVotes, render: (r) => fmtInt(r.marginVotes) },
    { key: 'marginPct', header: 'Margin (%)', align: 'end', accessor: (r) => r.marginPct.value, render: (r) => <ShareCell metric={r.marginPct} /> },
    { key: 'total', header: 'Total votes counted', align: 'end', accessor: (r) => r.totalVotes, render: (r) => fmtInt(r.totalVotes) },
    { key: 'electors', header: 'Registered electors', align: 'end', accessor: (r) => r.electors, render: (r) => fmtInt(r.electors) },
    { key: 'turnout', header: 'Turnout', align: 'end', accessor: (r) => r.turnoutPct.value, render: (r) => <ShareCell metric={r.turnoutPct} /> },
  ];

  const candCols: Column<CandidateRow>[] = [
    { key: 'year', header: 'Year', accessor: (r) => r.year },
    { key: 'rank', header: 'Rank', accessor: (r) => r.rank },
    { key: 'name', header: 'Candidate', accessor: (r) => r.name },
    { key: 'party', header: 'Party', accessor: (r) => r.party, render: (r) => <PartyBadge party={r.party} /> },
    { key: 'votes', header: 'Votes', align: 'end', accessor: (r) => r.votes, render: (r) => fmtInt(r.votes) },
    { key: 'share', header: 'Vote share', align: 'end', accessor: (r) => r.share.value, render: (r) => <ShareCell metric={r.share} /> },
  ];

  // comparison of two chosen years
  const elA = parliament.elections.find((e) => e.year === compareA);
  const elB = parliament.elections.find((e) => e.year === compareB);
  const cmpRows = useMemo(() => {
    if (!elA || !elB) return [];
    return partiesIn([elA, elB]).map((p) => {
      const a = partyShareSeries([elA], [p])[0][p] as number | null;
      const b = partyShareSeries([elB], [p])[0][p] as number | null;
      return { party: p, a, b, change: swing(a, b) };
    });
  }, [elA, elB]);

  const margins = summaries.map((s) => ({ year: s.year, votes: s.marginVotes, pct: s.marginPct.value }));
  const turnout = summaries.map((s) => ({ year: s.year, turnout: s.turnoutPct.value }));
  const SRC = 'ECI results via Wikipedia (see Sources)';

  return (
    <>
      <header className="page-header">
        <h1>Lok Sabha election results</h1>
        <p>Machilipatnam, {allYears[0]}–{allYears[allYears.length - 1]}. Pick election years to update every chart and table on this page.</p>
      </header>

      <section className="panel mb-4" aria-label="Filters">
        <YearFilter legend="Election years" years={allYears} selected={pcYears} onChange={setPcYears} />
      </section>

      {selected.length === 0 ? (
        <StatusMessage kind="empty" message="No election year selected. Choose at least one year above." />
      ) : (
        <>
          <Row className="g-3 mb-4">
            <Col lg={7}>
              <ChartCard title="Vote share by party" subtitle="Share of total votes counted (%), per election year" source={SRC}>
                <BarChart data={shareRows}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" />
                  <YAxis unit="%" domain={[0, 100]} label={{ value: 'Vote share (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                  {parties.map((p) => <Bar key={p} dataKey={p} fill={partyColor(p)} radius={[3, 3, 0, 0]} />)}
                </BarChart>
              </ChartCard>
            </Col>
            <Col lg={5}>
              <ChartCard title="Winning margin" subtitle="Votes (bars, left axis) and % of votes counted (line, right axis)" source={SRC} isEmpty={margins.every((m) => m.votes === null)}>
                <ComposedChart data={margins}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="year" />
                  <YAxis yAxisId="l" tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <YAxis yAxisId="r" orientation="right" unit="%" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="l" dataKey="votes" name="Margin (votes)" fill="#1d2b4f" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="r" dataKey="pct" name="Margin (%)" stroke="#a8402f" strokeWidth={2} />
                </ComposedChart>
              </ChartCard>
            </Col>
          </Row>

          <Row className="g-3 mb-4">
            <Col lg={6}>
              <ChartCard title="Voter turnout" subtitle="Votes polled ÷ registered electors (%)" source={`${SRC}; turnout as reported where electors are unavailable`} height={240}>
                <LineChart data={turnout}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis unit="%" domain={[60, 100]} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Line dataKey="turnout" name="Turnout (%)" stroke="#2b7a84" strokeWidth={2} dot />
                </LineChart>
              </ChartCard>
            </Col>
            <Col lg={6}>
              <section className="panel h-100">
                <h2 className="panel-title">Compare two elections</h2>
                <Row className="g-2 mb-2">
                  <Col xs={6}>
                    <Form.Group controlId="cmp-a"><Form.Label>From</Form.Label>
                      <Form.Select size="sm" value={compareA} onChange={(e) => setCompareA(Number(e.target.value))}>
                        {allYears.map((y) => <option key={y} value={y}>{y}</option>)}
                      </Form.Select></Form.Group>
                  </Col>
                  <Col xs={6}>
                    <Form.Group controlId="cmp-b"><Form.Label>To</Form.Label>
                      <Form.Select size="sm" value={compareB} onChange={(e) => setCompareB(Number(e.target.value))}>
                        {allYears.map((y) => <option key={y} value={y}>{y}</option>)}
                      </Form.Select></Form.Group>
                  </Col>
                </Row>
                {compareA === compareB ? (
                  <StatusMessage kind="info" message="Choose two different years to see the change." />
                ) : (
                  <div className="table-scroll">
                    <Table size="sm" className="mb-0">
                      <caption className="visually-hidden">Party vote share, {compareA} versus {compareB}</caption>
                      <thead><tr><th scope="col">Party</th><th scope="col" className="text-end">{compareA}</th><th scope="col" className="text-end">{compareB}</th><th scope="col" className="text-end">Change</th></tr></thead>
                      <tbody>
                        {cmpRows.map((r) => (
                          <tr key={r.party}>
                            <td><PartyBadge party={r.party} /></td>
                            <td className="text-end">{r.a === null ? 'Did not feature' : `${r.a}%`}</td>
                            <td className="text-end">{r.b === null ? 'Did not feature' : `${r.b}%`}</td>
                            <td className="text-end">{fmtSigned(r.change)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </section>
            </Col>
          </Row>

          <section className="panel mb-4">
            <h2 className="panel-title">Election summary</h2>
            <DataTable caption="Election summary by year" columns={summaryCols} rows={summaries} rowKey={(r) => String(r.year)} pageSize={6} />
            <p className="source-note">† as reported by the source because the data needed to compute it is not available. Vote share and margin % use total votes counted as the denominator.</p>
          </section>

          <section className="panel mb-4">
            <h2 className="panel-title">Candidate-wise results</h2>
            <DataTable caption="Candidate-wise results" columns={candCols} rows={candidateRows} rowKey={(r) => r.id} searchable pageSize={8} />
            <SourceNote sources={parliament.sources} />
            {selected.filter((e) => e.note).map((e) => <p key={e.year} className="source-note">Note {e.year}: {e.note}</p>)}
          </section>
        </>
      )}
    </>
  );
}
