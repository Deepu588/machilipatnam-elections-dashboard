export const UNAVAILABLE = 'Unavailable';
const ok = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n);

export const fmtInt = (n: number | null | undefined): string => (ok(n) ? n.toLocaleString('en-IN') : UNAVAILABLE);
export const fmtPct = (n: number | null | undefined, digits = 2): string => (ok(n) ? `${n.toFixed(digits)}%` : UNAVAILABLE);
export const fmtSigned = (n: number | null | undefined, suffix = ' pp'): string =>
  ok(n) ? `${n > 0 ? '+' : ''}${n.toFixed(2)}${suffix}` : UNAVAILABLE;
