import { api } from './api';
import { useCallback, useEffect, useState } from 'react';

export type SandboxConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'qr_required'
  | 'connected'
  | 'authenticated';

export interface SandboxConnection {
  state: SandboxConnectionState;
  instance_name: string;
  provider: string;
}

interface UseSandboxConnectionResult {
  data: SandboxConnection | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSandboxConnection(
  orgId: string | undefined,
): UseSandboxConnectionResult {
  const [data, setData] = useState<SandboxConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnection = useCallback(async (showLoading = true) => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const result = await api.request<SandboxConnection>(
        '/control/v1/sandbox/connection',
        {
          headers: {
            'X-Org-Id': orgId,
          },
          cache: 'no-store',
        },
      );

      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [orgId]);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  useEffect(() => {
    if (!orgId || data?.state === 'connected') {
      return;
    }

    const interval = window.setInterval(() => {
      fetchConnection(false);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [orgId, data?.state, fetchConnection]);

  return {
    data,
    loading,
    error,
    refresh: () => fetchConnection(true),
  };
}
