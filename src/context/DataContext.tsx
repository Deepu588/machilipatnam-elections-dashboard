import { createContext, useContext, type ReactNode } from 'react';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import type { AssemblyData, Constituency, ParliamentData } from '../types';

export interface DashboardData { constituency: Constituency; parliament: ParliamentData; assembly: AssemblyData }
interface Ctx {
  status: 'loading' | 'error' | 'ready';
  error: string | null;
  data: DashboardData | null;
  reload: () => void;
}

const DataCtx = createContext<Ctx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const state = useAsync<DashboardData>(async () => {
    const [constituency, parliament, assembly] = await Promise.all([
      api.getConstituency(),
      api.getParliament(),
      api.getAssembly(),
    ]);
    return { constituency, parliament, assembly };
  });
  return <DataCtx.Provider value={{ status: state.status, error: state.error, data: state.data, reload: state.reload }}>{children}</DataCtx.Provider>;
}

export function useDashboardStatus(): Ctx {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error('useDashboardStatus must be used inside <DataProvider>');
  return ctx;
}

/** For pages rendered only after data is ready. */
export function useDashboardData(): DashboardData {
  const { data } = useDashboardStatus();
  if (!data) throw new Error('Dashboard data is not loaded yet');
  return data;
}
