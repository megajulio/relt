import { api } from './api';
import { useCallback, useEffect, useState } from 'react';

export interface SandboxQR {
  qr_base64?: string;
  instance_name?: string;
  status:
    | 'ready'
    | 'available'
    | 'connected'
    | 'no_qr_available'
    | 'not_provisioned'
    | 'error';

  /** Clave del catálogo del mensaje de estado (se resuelve con `t()`). */
  messageKey?: string;
  error?: string;
}

interface UseSandboxQRResult {
  data: SandboxQR | null;
  loading: boolean;
  error: string | null;
  /**
   * D6 (#69, ANEXO-69-A A-6): el backend respondió **403** `insufficient-role`.
   * La página muestra el aviso del rol (no el error genérico) y NO reintenta.
   */
  forbidden: boolean;
  refresh: () => Promise<void>;
}

export function useSandboxQR(
  orgId: string | undefined,
  /**
   * D6 (#69, A-6): con `member` o `viewer` la página NO pide `/sandbox/qr`
   * (el QR permite vincular un teléfono). Se pasa `false` y no hay petición.
   */
  enabled = true,
): UseSandboxQRResult {
  const [data, setData] = useState<SandboxQR | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const fetchQR = useCallback(
    async (showLoading = true) => {
      if (!enabled || !orgId) {
        setLoading(false);
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        }

        setError(null);
        setForbidden(false);

        const result = await api.request<SandboxQR>(
          '/control/v1/sandbox/qr',
          {
            headers: {
              'X-Org-Id': orgId,
            },
            cache: 'no-store',
          },
        );

        setData(result);
      } catch (err) {
        const status = (err as Error & { status?: number }).status;

        if (status === 404) {
          setData({
            status: 'not_provisioned',
            messageKey: 'sandbox.qr.not-provisioned',
          });
          setError(null);
          return;
        }

        // A-6 (#69): un 403 de la guarda de rol no es un error de carga.
        if (status === 403) {
          setData(null);
          setError(null);
          setForbidden(true);
          return;
        }

        setError((err as Error).message);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [orgId, enabled],
  );

  // Carga inicial.
  useEffect(() => {
    fetchQR(true);
  }, [fetchQR]);

  // Polling mientras existe un QR disponible.
  useEffect(() => {
    if (!enabled || !orgId || !data?.qr_base64) {
      return;
    }

    const interval = window.setInterval(() => {
      fetchQR(false);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [orgId, enabled, data?.qr_base64, fetchQR]);

  return {
    data,
    loading,
    error,
    forbidden,
    refresh: () => fetchQR(true),
  };
}
