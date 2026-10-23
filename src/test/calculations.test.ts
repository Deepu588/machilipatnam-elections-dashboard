import { describe, expect, it } from 'vitest';
import parliament from '../../public/data/parliament.json';
import type { ParliamentData } from '../types';
import { normalizeParliament } from '../services/normalize';
import {
  marginPercent, partiesIn, partyShareSeries, rankCandidates, summarizeElection, swing,
  turnoutPercent, voteShare, winningMargin,
} from '../utils/calculations';

const data = normalizeParliament(parliament as unknown as ParliamentData);
const year = (y: number) => data.elections.find((e) => e.year === y)!;

describe('basic formulas', () => {
  it('vote share = votes / total x 100 (2014 TDP = 51.47%)', () => {
    expect(voteShare(587280, 1141065)).toBe(51.47);
  });
  it('winning margin = winner - runner-up', () => {
    expect(winningMargin(587280, 506223)).toBe(81057);
  });
  it('margin % = margin / total x 100', () => {
    expect(marginPercent(223179, 1315489)).toBe(16.97);
  });
  it('turnout = polled / electors x 100 (2019 = 84.54%)', () => {
    expect(turnoutPercent(1245552, 1473347)).toBe(84.54);
  });
  it('returns null instead of NaN/Infinity for missing or zero denominators', () => {
    expect(voteShare(100, null)).toBeNull();
    expect(voteShare(100, 0)).toBeNull();
    expect(voteShare(null, 100)).toBeNull();
    expect(winningMargin(100, null)).toBeNull();
    expect(turnoutPercent(100, 0)).toBeNull();
    expect(swing(null, 5)).toBeNull();
    expect(swing(10, 14.5)).toBe(4.5);
  });
});

describe('election summaries on the real dataset', () => {
  it('2024: winner JSP, margin 223,179 votes', () => {
    const s = summarizeElection(year(2024));
    expect(s.winner?.party).toBe('JSP');
    expect(s.marginVotes).toBe(223179);
    expect(s.winnerShare).toEqual({ value: 55.07, basis: 'computed' });
  });
  it('2014 margin matches the published 81,057', () => {
    expect(summarizeElection(year(2014)).marginVotes).toBe(81057);
  });
  it('2019 turnout is computed from electors; 2014 falls back to the reported value', () => {
    expect(summarizeElection(year(2019)).turnoutPct).toEqual({ value: 84.54, basis: 'computed' });
    expect(summarizeElection(year(2014)).turnoutPct).toEqual({ value: 83.33, basis: 'reported' });
  });
  it('NOTA is never ranked as winner or runner-up', () => {
    const ranked = rankCandidates(year(2014).candidates);
    expect(ranked.some((c) => c.party === 'NOTA')).toBe(false);
    expect(summarizeElection(year(2014)).runnerUp?.party).toBe('YSRCP');
  });
});

describe('missing and invalid data', () => {
  it('uses reported shares when total votes are missing', () => {
    const s = summarizeElection({
      year: 2000, totalVotes: null, reportedTurnoutPct: null,
      candidates: [
        { name: 'A', party: 'X', votes: 600, reportedShare: 60 },
        { name: 'B', party: 'Y', votes: 300, reportedShare: 30 },
      ],
    });
    expect(s.winnerShare).toEqual({ value: 60, basis: 'reported' });
    expect(s.marginVotes).toBe(300);
    expect(s.marginPct).toEqual({ value: 30, basis: 'reported' });
    expect(s.turnoutPct).toEqual({ value: null, basis: null });
  });
  it('handles an election with no candidates without throwing', () => {
    const s = summarizeElection({ year: 2000, totalVotes: null, reportedTurnoutPct: null, candidates: [] });
    expect(s.winner).toBeNull();
    expect(s.marginVotes).toBeNull();
  });
  it('normalizer drops malformed candidates and non-numeric totals', () => {
    const out = normalizeParliament({
      sources: [],
      elections: [{ year: 2001, totalVotes: 'oops', electors: null, reportedTurnoutPct: null, candidates: [{ name: 'ok', party: 'P', votes: 5, reportedShare: null }, { name: 'bad', party: 'P', votes: 'x' }] }],
    } as unknown as ParliamentData);
    expect(out.elections[0].totalVotes).toBeNull();
    expect(out.elections[0].candidates).toHaveLength(1);
  });
});

describe('party series', () => {
  it('builds one row per year with null where a party is absent', () => {
    const rows = partyShareSeries(data.elections);
    expect(rows.map((r) => r.year)).toEqual([2009, 2014, 2019, 2024]);
    expect(rows[0].YSRCP).toBeNull();
    expect(rows[3].JSP).toBe(55.07);
    expect(partiesIn(data.elections)).toContain('TDP');
  });
});
