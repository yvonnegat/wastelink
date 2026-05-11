/**
 * useApi — Generic hook for API calls with loading/error/data state
 * Usage:
 *   const { data, loading, error, refetch } = useApi(() => api.listings.mine(), []);
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useApi(apiFn, deps = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const mountedRef             = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn();
      if (mountedRef.current) setData(res?.data ?? res);
    } catch (err) {
      if (mountedRef.current) setError(err.message || 'Something went wrong');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

/**
 * useMutation — Hook for POST/PATCH/DELETE calls
 * Usage:
 *   const { mutate, loading, error } = useMutation((id) => api.listings.delete(id));
 *   await mutate(listingId);
 */
export function useMutation(apiFn, { onSuccess, onError } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(...args);
      onSuccess?.(res);
      return res;
    } catch (err) {
      const msg = err.message || 'Something went wrong';
      setError(msg);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn, onSuccess, onError]);

  return { mutate, loading, error };
}

export default useApi;