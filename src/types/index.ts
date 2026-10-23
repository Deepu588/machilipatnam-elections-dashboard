export interface Source { label: string; url: string }

export interface Candidate {
  name: string;
  party: string;
  votes: number;
  /** Vote share exactly as printed in the source (may use a slightly different denominator). */
  reportedShare: number | null;
}

export interface ElectionBase {
  year: number;
  /** Total votes counted, used as the vote-share denominator. null = not in source. */
  totalVotes: number | null;
  reportedTurnoutPct: number | null;
  candidates: Candidate[];
  note?: string;
}

export interface PcElection extends ElectionBase { electors: number | null }
export type AcElection = ElectionBase;

export interface ParliamentData { sources: Source[]; elections: PcElection[] }

export interface AssemblyConstituency {
  id: number;
  name: string;
  reservation: 'GEN' | 'SC' | 'ST';
  mandals: string[];
  electors2019: number | null;
  elections: AcElection[];
}
export interface AssemblyData { sources: Source[]; constituencies: AssemblyConstituency[] }

export interface DataPoint {
  label?: string;
  unit?: string;
  value: number | null;
  referenceYear: number | null;
  source: string;
  note?: string;
}

export interface Constituency {
  name: string;
  number: number;
  state: string;
  districts: string;
  category: string;
  coverage: string;
  currentMp: { name: string; party: string; since: number };
  electors: DataPoint;
  demographics: Record<string, DataPoint>;
  sources: Source[];
}

/** A number plus how it was obtained. */
export type Basis = 'computed' | 'reported' | null;
export interface Metric { value: number | null; basis: Basis }
