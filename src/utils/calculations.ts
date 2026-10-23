/**
 * All electoral formulas live here (and only here) so components never re-implement them.
 *
 *  Vote Share (%)      = candidate votes / total votes counted x 100
 *  Winning Margin      = winner votes - runner-up votes
 *  Winning Margin (%)  = margin / total votes counted x 100
 *  Voter Turnout (%)   = total votes polled / registered electors x 100
 */
import type { Candidate, ElectionBase, Metric, PcElection } from '../types';

export const round2 = (n: number): number => Math.round(n * 100) / 100;
const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
export const isNota = (c: Candidate): boolean => c.party === 'NOTA';

export function voteShare(votes: number | null, total: number | null): number | null {
  if (!isNum(votes) || !isNum(total) || total <= 0) return null;
  return round2((votes / total) * 100);
}

export function winningMargin(winnerVotes: number | null, runnerUpVotes: number | null): number | null {
  if (!isNum(winnerVotes) || !isNum(runnerUpVotes)) return null;
  return winnerVotes - runnerUpVotes;
}

export function marginPercent(margin: number | null, total: number | null): number | null {
  if (!isNum(margin) || !isNum(total) || total <= 0) return null;
  return round2((margin / total) * 100);
}

export function turnoutPercent(votesPolled: number | null, electors: number | null): number | null {
  if (!isNum(votesPolled) || !isNum(electors) || electors <= 0) return null;
  return round2((votesPolled / electors) * 100);
}

/** Candidates ranked by votes, NOTA excluded (NOTA cannot win or be runner-up). */
export function rankCandidates(candidates: Candidate[]): Candidate[] {
  return candidates.filter((c) => isNum(c.votes) && !isNota(c)).sort((a, b) => b.votes - a.votes);
}

/** Computed share when a denominator exists, otherwise the share as printed in the source. */
export function shareOf(c: Candidate, total: number | null): Metric {
  const computed = voteShare(c.votes, total);
  if (computed !== null) return { value: computed, basis: 'computed' };
  if (isNum(c.reportedShare)) return { value: c.reportedShare, basis: 'reported' };
  return { value: null, basis: null };
}

export interface ElectionSummary {
  year: number;
  winner: Candidate | null;
  runnerUp: Candidate | null;
  winnerShare: Metric;
  marginVotes: number | null;
  marginPct: Metric;
  turnoutPct: Metric;
  totalVotes: number | null;
  electors: number | null;
}

export function summarizeElection(e: ElectionBase & { electors?: number | null }): ElectionSummary {
  const [winner = null, runnerUp = null] = rankCandidates(e.candidates ?? []);
  const winnerShare: Metric = winner ? shareOf(winner, e.totalVotes) : { value: null, basis: null };
  const marginVotes = winningMargin(winner?.votes ?? null, runnerUp?.votes ?? null);

  let marginPct: Metric = { value: marginPercent(marginVotes, e.totalVotes), basis: 'computed' };
  if (marginPct.value === null) {
    // fall back to the difference of the two reported shares
    const a = winner?.reportedShare;
    const b = runnerUp?.reportedShare;
    marginPct = isNum(a) && isNum(b) ? { value: round2(a - b), basis: 'reported' } : { value: null, basis: null };
  }

  const electors = e.electors ?? null;
  const computedTurnout = turnoutPercent(e.totalVotes, electors);
  const turnoutPct: Metric =
    computedTurnout !== null
      ? { value: computedTurnout, basis: 'computed' }
      : isNum(e.reportedTurnoutPct)
        ? { value: e.reportedTurnoutPct, basis: 'reported' }
        : { value: null, basis: null };

  return { year: e.year, winner, runnerUp, winnerShare, marginVotes, marginPct, turnoutPct, totalVotes: e.totalVotes, electors };
}

export const summarizeAll = (elections: PcElection[]): ElectionSummary[] => elections.map(summarizeElection);

/** Parties that contested (NOTA excluded), ordered by total votes across the given elections. */
export function partiesIn(elections: ElectionBase[]): string[] {
  const totals = new Map<string, number>();
  elections.forEach((e) =>
    e.candidates.filter((c) => !isNota(c)).forEach((c) => totals.set(c.party, (totals.get(c.party) ?? 0) + c.votes)),
  );
  return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p);
}

export type PartySeriesRow = { year: number } & Record<string, number | null>;

/** One row per election year with a vote-share column per party (null where the party is not listed). */
export function partyShareSeries(elections: ElectionBase[], parties = partiesIn(elections)): PartySeriesRow[] {
  return [...elections]
    .sort((a, b) => a.year - b.year)
    .map((e) => {
      const row: PartySeriesRow = { year: e.year };
      parties.forEach((p) => {
        const best = e.candidates.filter((c) => c.party === p).sort((a, b) => b.votes - a.votes)[0];
        row[p] = best ? shareOf(best, e.totalVotes).value : null;
      });
      return row;
    });
}

/** Change in percentage points between two values; null if either is missing. */
export function swing(prev: number | null | undefined, curr: number | null | undefined): number | null {
  return isNum(prev) && isNum(curr) ? round2(curr - prev) : null;
}
