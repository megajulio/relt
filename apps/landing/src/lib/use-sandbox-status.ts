import { useState, useEffect, useCallback } from 'react';

export interface SandboxStatus {
  status: 'pending' | 'provisioning' | 'ready' | 'failed' | null;
  provisioned: boolean;
  attempts: number;
  last_error: string | null;
  last_error_code: string | null;
  last_attempt_at: string | null;
  next_retry_at: string | null;
  provider_account_id: string | null;
  instance_name: string | null;
  retry_available: boolean;
}

interface UseSandboxStatusResult {
  data: SandboxStatus | null;
  loading: boolean;
  error: string | null;
  retrying: boolean;
  retry: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook para consumir el estado del sandbox desde G7/G8.
 * 
 * Llama a GET /control/v1/sandbox/status al montar.
 * Exponer retry() para POST /control/v1/sandbox/retry.
 */
export function useSandboxStatus(orgId: string | undefined): UseSandboxStatusResult {
  const [data, setData] = useState<SandboxStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/control/sandbox/status', {
        headers: {
          'X-Org-Id': orgId,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sandbox status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const retry = useCallback(async () => {
    if (!orgId) return;

    try {
      setRetrying(true);
      setError(null);

      const response = await fetch('/api/control/sandbox/retry', {
        method: 'POST',
        headers: {
          'X-Org-Id': orgId,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Retry failed: ${response.status}`);
      }

      const result = await response.json();
      setData({
        ...data,
        ...result,
      });

      // Refresh después de retry para obtener estado actualizado
      await fetchStatus();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRetrying(false);
    }
  }, [orgId, data, fetchStatus]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    data,
    loading,
    error,
    retrying,
    retry,
    refresh: fetchStatus,
  };
}
