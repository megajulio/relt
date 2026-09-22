'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  assignChannel,
  getAgent,
  listPhoneNumbers,
  unassignChannel,
  type AgentDetail,
  type PhoneNumberCatalogItem,
} from '@/lib/agents';

const selectCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed';

export default function AgentChannelsForm({
  agent,
  onSaved,
}: {
  agent: AgentDetail;
  onSaved: (a: AgentDetail) => void;
}) {
  const [catalog, setCatalog] = useState<PhoneNumberCatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    listPhoneNumbers()
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setLoadingCatalog(false));
  }, []);

  // Resetear info/error cuando cambia el agent
  useEffect(() => {
    setError(null);
    setInfo(null);
  }, [agent.id, agent.updatedAt]);

  const activeBindings = agent.bindings.filter((b) => b.status !== 'archived');
  const assignedIds = useMemo(
    () => new Set(activeBindings.map((b) => b.phoneNumberId)),
    [activeBindings]
  );
  const available = catalog.filter((p) => !assignedIds.has(p.id));

  async function handleAssign() {
    if (!selectedId) return;
    setError(null);
    setInfo(null);
    setBusy('assign');
    try {
      await assignChannel(agent.id, selectedId, isDefault);
      const fresh = await getAgent(agent.id);
      onSaved(fresh);
      setInfo('Channel assigned successfully.');
      setSelectedId('');
    } catch (err: any) {
      const msg = err?.message || 'Error assigning channel';
      if (msg.toLowerCase().includes('conflict') || msg.includes('409')) {
        setError('This channel is already assigned to this agent.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleUnassign(bindingId: string) {
    setError(null);
    setInfo(null);
    setBusy(bindingId);
    try {
      await unassignChannel(agent.id, bindingId);
      const fresh = await getAgent(agent.id);
      onSaved(fresh);
      setInfo('Channel unassigned successfully.');
    } catch (err: any) {
      setError(err?.message || 'Error unassigning channel');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {info && !error && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-300">
          {info}
        </div>
      )}

      {/* Current bindings */}
      <div>
        <div className="text-sm text-gray-400 mb-2">Current channel bindings</div>
        {activeBindings.length === 0 ? (
          <div className="text-sm text-gray-500 py-6 text-center bg-gray-950 border border-gray-800 rounded-lg">
            No channels assigned yet.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Default</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeBindings.map((b) => (
                <tr key={b.id} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-3 text-sm text-gray-200 font-mono">{b.phoneNumber}</td>
                  <td className="px-4 py-3">
                    {b.isDefault ? (
                      <span className="px-2 py-0.5 rounded-md text-xs bg-blue-500/20 text-blue-300">
                        Default
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-md text-xs capitalize bg-green-500/20 text-green-400">
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleUnassign(b.id)}
                      disabled={busy === b.id}
                      className="px-3 py-1 rounded-md text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-300 disabled:opacity-40 transition-colors"
                    >
                      {busy === b.id ? 'Removing...' : 'Unassign'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Assign new */}
      <div className="border-t border-gray-800 pt-5">
        <div className="text-sm text-gray-400 mb-3">Assign new channel</div>

        {loadingCatalog && (
          <div className="text-sm text-gray-500">Loading catalog...</div>
        )}

        {!loadingCatalog && catalog.length === 0 && (
          <div className="text-sm text-gray-500 bg-gray-950 border border-gray-800 rounded-lg p-4">
            No phone numbers available in this organization.
          </div>
        )}

        {!loadingCatalog && catalog.length > 0 && (
          <div className="space-y-3">
            <select
              className={selectCls}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">— select a phone number —</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.phoneNumber} ({p.provider} · {p.status})
                </option>
              ))}
              {available.length === 0 && (
                <option value="" disabled>
                  All available phone numbers are already assigned
                </option>
              )}
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                disabled={!selectedId}
                className="w-4 h-4 accent-blue-600 disabled:opacity-40"
              />
              <span className="text-sm text-gray-300">Assign as default</span>
              <span className="text-xs text-gray-500">
                (this channel will route new conversations to this agent)
              </span>
            </label>

            <div className="flex justify-end">
              <button
                onClick={handleAssign}
                disabled={!selectedId || busy === 'assign'}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {busy === 'assign' ? 'Assigning...' : 'Assign'}
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Para cambiar el canal default, primero haz Unassign del canal default actual y
              luego asigna otro nuevo con &quot;Assign as default&quot;. El índice único parcial
              de F.7 garantiza un solo default por canal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
