import { useCallback, useEffect, useState } from 'react';

export type AsyncState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'error'; data: null; error: string }
  | { status: 'ready'; data: T; error: null };

/** Runs an async loader on mount and exposes loading / error / ready plus a reload function. */
export function useAsync<T>(loader: () => Promise<T>): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading', data: null, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });
    loader()
      .then((data) => !cancelled && setState({ status: 'ready', data, error: null }))
      .catch((e: unknown) =>
        !cancelled && setState({ status: 'error', data: null, error: e instanceof Error ? e.message : 'Unexpected error' }),
      );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload } as AsyncState<T> & { reload: () => void };
}
