import { useCallback, useEffect, useState } from 'react';
import { normalizeError } from '../utils/errors.js';

export function useQuery(fetcher) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null, meta: null });

  const load = useCallback(async (signal) => {
    setState((current) => ({ ...current, status: 'loading', error: null }));
    try {
      const payload = await fetcher(signal);
      if (signal?.aborted) return;
      setState({
        status: 'success',
        data: payload?.data ?? payload,
        meta: payload?.meta || null,
        error: null,
      });
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setState({ status: 'error', data: null, meta: null, error: normalizeError(error) });
    }
  }, [fetcher]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = useCallback(() => load(new AbortController().signal), [load]);
  return { ...state, reload };
}
