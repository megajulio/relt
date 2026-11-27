'use client';

import { useState } from 'react';
import Link from 'next/link';
import { assignChannel } from '@/lib/agents';
import { D5_NO_AGENT_TEXT } from '@/lib/orden49';
import { useAgentAccess } from '@/lib/agent-role';
import { useT } from '@/i18n/provider';

/**
 * Orden #49 · D5 — aviso visible de canal conectado sin agente, con la acción
 * directa de asignarlo. Se usa en el sandbox, en la pestaña Channels y en el
 * detalle del Agent (las tres superficies que pide la orden).
 */

export interface ChannelWithoutAgent {
  id: string;
  phoneNumber: string;
  provider?: string | null;
}

interface ChannelWithoutAgentNoticeProps {
  channel: ChannelWithoutAgent;
  /** Si hay Agent inequívoco, la acción asigna en un clic a ese Agent. */
  agentId?: string | null;
  onAssigned?: () => void;
  testId?: string;
}

export function ChannelWithoutAgentNotice({
  channel,
  agentId,
  onAssigned,
  testId = 'd5-notice',
}: ChannelWithoutAgentNoticeProps) {
  const t = useT();
  // ORDEN-68 · R3/A-6: en solo lectura no hay botón de asignar.
  const access = useAgentAccess();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    if (!agentId) return;
    setBusy(true);
    setError(null);
    try {
      await assignChannel(agentId, channel.id, true);
      onAssigned?.();
    } catch (err) {
      setError((err as Error).message || 'Error assigning channel');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      data-testid={testId}
      className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4"
    >
      <p className="text-sm font-medium text-yellow-200">{D5_NO_AGENT_TEXT}</p>

      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
        <span className="font-mono text-gray-200">{channel.phoneNumber}</span>
        {channel.provider && <span>· {channel.provider}</span>}
      </div>

      <div className="mt-3">
        {access.readOnly ? null : agentId ? (
          <button
            onClick={handleAssign}
            disabled={busy}
            className="rounded-lg bg-yellow-500/20 px-3 py-1.5 text-xs font-semibold text-yellow-100 hover:bg-yellow-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {busy ? 'Assigning…' : 'Assign to this Agent'}
          </button>
        ) : (
          <Link
            href="/dashboard/agents"
            className="text-xs font-semibold text-yellow-100 hover:text-yellow-50"
          >
            {t("dashboard.channels.choose-an-agent")}
          </Link>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
