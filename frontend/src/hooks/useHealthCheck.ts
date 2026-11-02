import { useState, useEffect, useCallback } from 'react';
import type { HealthStatus, ApiState } from '../types';
import { fetchHealth } from '../services/api';

export function useHealthCheck(pollIntervalMs?: number) {
  const [state, setState] = useState<ApiState<HealthStatus>>({
    data: null,
    loading: true,
    error: null,
  });

  const check = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchHealth();
      setState({ data, loading: false, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error connecting to backend';
      setState({ data: null, loading: false, error: message });
    }
  }, []);

  useEffect(() => {
    check();

    if (pollIntervalMs && pollIntervalMs > 0) {
      const timer = setInterval(check, pollIntervalMs);
      return () => clearInterval(timer);
    }
  }, [check, pollIntervalMs]);

  return { ...state, refetch: check };
}
