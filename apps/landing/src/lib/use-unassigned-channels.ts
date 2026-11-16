import { useCallback, useEffect, useState } from 'react';
import { listAgents, listPhoneNumbers } from './agents';

/**
 * Orden #49 · D5 — canales CONECTADOS sin binding activo.
 *
 * La fuente es `GET /control/v1/phone-numbers`, que ya devuelve `has_active_binding`
 * (backend 2b, commit `485abda`). No se toca el backend en el Bloque 3.
 */

export interface UnassignedChannel {
  id: string;
  phoneNumber: string;
  provider: string | null;
}

export interface UnassignedChannelsState {
  /** Canales conectados sin binding activo (D5). */
  channels: UnassignedChannel[];
  /**
   * Destino para la acción directa de asignar: solo cuando la organización tiene
   * EXACTAMENTE 1 Agent activo (la misma condición de D4). Con 0 o ≥2 no hay
   * asignación inequívoca y la acción lleva a elegir Agent.
   */
  singleActiveAgent: { id: string; name: string } | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useUnassignedChannels(orgId: string | undefined): UnassignedChannelsState {
  const [channels, setChannels] = useState<UnassignedChannel[]>([]);
  const [singleActiveAgent, setSingleActiveAgent] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [numbers, agents] = await Promise.all([listPhoneNumbers(), listAgents()]);

      setChannels(
        numbers
          .filter((n) => n.connectionState === 'connected' && !n.hasActiveBinding)
          .map((n) => ({ id: n.id, phoneNumber: n.phoneNumber, provider: n.provider || null })),
      );

      const active = agents.filter((a) => a.status === 'active');
      setSingleActiveAgent(
        active.length === 1 ? { id: active[0].id, name: active[0].name } : null,
      );
    } catch (err) {
      setError((err as Error).message);
      setChannels([]);
      setSingleActiveAgent(null);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    // El fetch inicial se difiere a un microtask: así el cuerpo del efecto no llama a
    // setState de forma síncrona (react-hooks/set-state-in-effect).
    let cancelled = false;
    const handle = setTimeout(() => {
      if (!cancelled) void refresh();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [refresh]);

  return { channels, singleActiveAgent, loading, error, refresh };
}
