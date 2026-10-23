import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useDashboardData } from './DataContext';

export type AcYear = 'all' | number;

interface Filters {
  pcYears: number[];
  setPcYears: (y: number[]) => void;
  compareA: number;
  compareB: number;
  setCompareA: (y: number) => void;
  setCompareB: (y: number) => void;
  acId: number;
  setAcId: (id: number) => void;
  acYear: AcYear;
  setAcYear: (y: AcYear) => void;
}

const FilterCtx = createContext<Filters | null>(null);

/** Shared filter state: selections made on one page are remembered when moving between pages. */
export function FilterProvider({ children }: { children: ReactNode }) {
  const { parliament, assembly } = useDashboardData();
  const years = parliament.elections.map((e) => e.year);
  const [pcYears, setPcYears] = useState<number[]>(years);
  const [compareA, setCompareA] = useState<number>(years[Math.max(years.length - 2, 0)] ?? 0);
  const [compareB, setCompareB] = useState<number>(years[years.length - 1] ?? 0);
  const [acId, setAcId] = useState<number>(assembly.constituencies[0]?.id ?? 0);
  const [acYear, setAcYear] = useState<AcYear>('all');

  const value = useMemo(
    () => ({ pcYears, setPcYears, compareA, compareB, setCompareA, setCompareB, acId, setAcId, acYear, setAcYear }),
    [pcYears, compareA, compareB, acId, acYear],
  );
  return <FilterCtx.Provider value={value}>{children}</FilterCtx.Provider>;
}

export function useFilters(): Filters {
  const ctx = useContext(FilterCtx);
  if (!ctx) throw new Error('useFilters must be used inside <FilterProvider>');
  return ctx;
}
