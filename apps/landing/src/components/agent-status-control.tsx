'use client';

import { useState } from 'react';
import { getAgent, updateAgentStatus, type AgentDetail } from '@/lib/agents';
import { useT } from '@/i18n/provider';

const STATUS_OPTIONS = ['active', 'paused', 'archived'] as const;
type Status = (typeof STATUS_OPTIONS)[number];

export default function AgentStatusControl({
  agent,
  onUpdated,
}: {
  agent: AgentDetail;
  onUpdated: (a: AgentDetail) => void;
}) {
  const t = useT();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: Status) {
    if (next === agent.status) return;
    setError(null);

    if (next === 'archived') {
      setConfirmArchive(true);
      return;
    }

    await applyStatus(next);
  }

  async function applyStatus(status: Status) {
    setBusy(true);
    setError(null);
    try {
      await updateAgentStatus(agent.id, status);
      const fresh = await getAgent(agent.id);
      onUpdated(fresh);
    } catch (err: any) {
      setError(err?.message || 'Error updating status');
    } finally {
      setBusy(false);
      setConfirmArchive(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-400">{t("agents.status.status")}</label>
        <select
          value={agent.status}
          onChange={(e) => handleChange(e.target.value as Status)}
          disabled={busy}
          className="bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500 disabled:opacity-40 capitalize"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
        {busy && <span className="text-xs text-gray-500">{t("agents.status.updating")}</span>}
      </div>

      {confirmArchive && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-3">
          <div className="text-sm text-yellow-200">
            <strong>{t("agents.status.archive-this-agent")}</strong> {t("agents.status.archived-agents-cannot-process-new-conversations-this-ca")}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => applyStatus('archived')}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-yellow-600 hover:bg-yellow-700 text-white transition-colors"
            >
              {t("agents.status.confirm-archive")}
            </button>
            <button
              onClick={() => setConfirmArchive(false)}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              {t("agents.status.cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
