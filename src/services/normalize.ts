import type { AcElection, AssemblyData, Candidate, ParliamentData } from '../types';

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Drops malformed candidates and coerces unknown numeric fields to null, so bad data never crashes the UI. */
function cleanCandidates(list: unknown): Candidate[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((c) => c && typeof c.name === 'string' && typeof c.party === 'string' && num(c.votes) !== null && c.votes >= 0)
    .map((c) => ({ name: c.name, party: c.party, votes: c.votes, reportedShare: num(c.reportedShare) }));
}

function cleanElection<T extends AcElection>(e: T): T {
  return { ...e, totalVotes: num(e.totalVotes), reportedTurnoutPct: num(e.reportedTurnoutPct), candidates: cleanCandidates(e.candidates) };
}

export function normalizeParliament(raw: ParliamentData): ParliamentData {
  const elections = Array.isArray(raw?.elections) ? raw.elections : [];
  return {
    sources: raw?.sources ?? [],
    elections: elections
      .filter((e) => num(e?.year) !== null)
      .map((e) => ({ ...cleanElection(e), electors: num(e.electors) }))
      .sort((a, b) => a.year - b.year),
  };
}

export function normalizeAssembly(raw: AssemblyData): AssemblyData {
  const list = Array.isArray(raw?.constituencies) ? raw.constituencies : [];
  return {
    sources: raw?.sources ?? [],
    constituencies: list
      .filter((c) => c && num(c.id) !== null && typeof c.name === 'string')
      .map((c) => ({
        ...c,
        mandals: Array.isArray(c.mandals) ? c.mandals : [],
        electors2019: num(c.electors2019),
        elections: (Array.isArray(c.elections) ? c.elections : [])
          .filter((e) => num(e?.year) !== null)
          .map(cleanElection)
          .sort((a, b) => a.year - b.year),
      }))
      .sort((a, b) => a.id - b.id),
  };
}
