import { useCallback, useEffect, useState } from 'react';
import { appCache, CACHE_TTL } from '@/lib/cache';

export function useCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    refreshInterval?: number;
  } = {}
) {
  const {
    ttl = CACHE_TTL.MEDIUM,
    enabled = true,
    refreshInterval
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    // Check cache first unless forced
    if (!force) {
      const cached = appCache.get(key);
      if (cached !== null) {
        setData(cached);
        return cached;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      appCache.set(key, result, ttl);
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl, enabled]);

  const invalidate = useCallback(() => {
    appCache.delete(key);
    setData(null);
  }, [key]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto refresh interval
  useEffect(() => {
    if (!refreshInterval || !enabled) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchData, refreshInterval, enabled]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
    isStale: data === null && !loading
  };
}

// Hook for cached mutations
export function useCachedMutation<T, P extends any[]>(
  mutationFn: (...args: P) => Promise<T>,
  options: {
    onSuccess?: (data: T, ...args: P) => void;
    onError?: (error: Error, ...args: P) => void;
    invalidateKeys?: string[];
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (...args: P) => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(...args);
      
      // Invalidate specified cache keys
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => {
          appCache.delete(key);
        });
      }

      options.onSuccess?.(result, ...args);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error, ...args);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options]);

  return {
    mutate,
    loading,
    error
  };
}