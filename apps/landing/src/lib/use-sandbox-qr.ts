import { useCallback, useEffect, useState } from 'react';

export interface SandboxQR {
  qr_base64?: string;
  instance_name?: string;
  status:
    | 'ready'
    | 'available'
    | 'connected'
    | 'no_qr_available'
    | 'error';

  message?: string;
  error?: string;
}

interface UseSandboxQRResult {
  data: SandboxQR | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSandboxQR(
  orgId: string | undefined,
): UseSandboxQRResult {
  const [data, setData] = useState<SandboxQR | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQR = useCallback(
    async (showLoading = true) => {
      if (!orgId) {
        setLoading(false);
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        }

        setError(null);

        const response = await fetch('/api/control/sandbox/qr', {
          headers: {
            'X-Org-Id': orgId,
          },
          cache: 'no-store',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.detail ||
              result.error ||
              `Failed to fetch sandbox QR: ${response.status}`,
          );
        }

        setData(result);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [orgId],
  );

  // Carga inicial.
  useEffect(() => {
    fetchQR(true);
  }, [fetchQR]);

  // Polling mientras existe un QR disponible.
  useEffect(() => {
    if (!orgId || !data?.qr_base64) {
      return;
    }

    const interval = window.setInterval(() => {
      fetchQR(false);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [orgId, data?.qr_base64, fetchQR]);

  return {
    data,
    loading,
    error,
    refresh: () => fetchQR(true),
  };
}
