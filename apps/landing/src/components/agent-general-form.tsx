'use client';

import { useState } from 'react';
import { getAgent, updateAgent, type AgentDetail } from '@/lib/agents';

const inputCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed';

type RequestError = Error & { status?: number };

export default function AgentGeneralForm({
  agent,
  onSaved,
}: {
  agent: AgentDetail;
  onSaved: (a: AgentDetail) => void;
}) {
  const [name, setName] = useState(agent.name);
  const [defaultSkill, setDefaultSkill] = useState(agent.defaultSkill);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const originalName = agent.name;
  const originalDefaultSkill = agent.defaultSkill;

  const dirty =
    name !== originalName || defaultSkill !== originalDefaultSkill;

  async function handleSave() {
    setError(null);
    setSaved(false);

    const nextName = name.trim();
    const nextDefaultSkill = defaultSkill.trim();

    if (!nextName || !nextDefaultSkill) {
      setError('Name and Default Skill are required.');
      return;
    }

    if (!dirty) return;

    setSaving(true);

    try {
      await updateAgent(agent.id, {
        ...(nextName !== originalName ? { name: nextName } : {}),
        ...(nextDefaultSkill !== originalDefaultSkill
          ? { defaultSkill: nextDefaultSkill }
          : {}),
      });

      const fresh = await getAgent(agent.id);
      setName(fresh.name);
      setDefaultSkill(fresh.defaultSkill);
      onSaved(fresh);
      setSaved(true);
    } catch (err) {
      const requestError = err as RequestError;

      if (requestError.status === 400) {
        setError(requestError.message || 'Invalid agent data.');
      } else if (requestError.status === 404) {
        setError('This agent is no longer available.');
      } else if (requestError.status === 409) {
        setError(requestError.message || 'Agent update conflict.');
      } else {
        setError(requestError.message || 'Error updating agent.');
      }
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setName(originalName);
    setDefaultSkill(originalDefaultSkill);
    setError(null);
    setSaved(false);
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {saved && !dirty && !error && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-300">
          Agent updated successfully.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Name</label>
          <input
            type="text"
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Key</label>
          <input
            type="text"
            className={inputCls}
            value={agent.key}
            disabled
            readOnly
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            Default Skill
          </label>
          <input
            type="text"
            className={inputCls}
            value={defaultSkill}
            onChange={(e) => setDefaultSkill(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4 space-y-3">
        <div className="flex items-center justify-between gap-6">
          <span className="text-sm text-gray-500">Created</span>
          <span className="text-sm text-gray-300 text-right">
            {new Date(agent.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-sm text-gray-500">Updated</span>
          <span className="text-sm text-gray-300 text-right">
            {new Date(agent.updatedAt).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
