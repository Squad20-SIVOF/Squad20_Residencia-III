import { useCallback, useEffect, useState } from 'react';

interface AsyncState<T> { data: T | null; isLoading: boolean; error: Error | null; }
type Loader<T> = () => Promise<T>;

export function useAsync<T>(loader: Loader<T>) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, isLoading: true, error: null });
  const reload = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }));
    try { const data = await loader(); setState({ data, isLoading: false, error: null }); }
    catch (cause: unknown) { const error = cause instanceof Error ? cause : new Error('Não foi possível carregar os dados.'); setState((current) => ({ ...current, isLoading: false, error })); }
  }, [loader]);
  useEffect(() => { void reload(); }, [reload]);
  return { ...state, reload };
}
