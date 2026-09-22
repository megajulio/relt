'use client';

import { useEffect, useState } from 'react';
import {
  getAgent,
  listSkills,
  patchAgentConfig,
  type AgentDetail,
  type SkillCatalogItem,
} from '@/lib/agents';

const inputCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500';

export default function AgentSkillsForm({
  agent,
  onSaved,
}: {
  agent: AgentDetail;
  onSaved: (a: AgentDetail) => void;
}) {
  const [catalog, setCatalog] = useState<SkillCatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [skill, setSkill] = useState(agent.config.skillBinding?.skill ?? agent.defaultSkill ?? '');
  const [mode, setMode] = useState<'automatic' | 'pinned'>(
    agent.config.skillBinding?.version ? 'pinned' : 'automatic'
  );
  const [version, setVersion] = useState(agent.config.skillBinding?.version ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    listSkills()
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setLoadingCatalog(false));
  }, []);

  useEffect(() => {
    setSkill(agent.config.skillBinding?.skill ?? agent.defaultSkill ?? '');
    setMode(agent.config.skillBinding?.version ? 'pinned' : 'automatic');
    setVersion(agent.config.skillBinding?.version ?? '');
  }, [agent.id, agent.updatedAt]);

  const originalSkill = agent.config.skillBinding?.skill ?? agent.defaultSkill ?? '';
  const originalMode = agent.config.skillBinding?.version ? 'pinned' : 'automatic';
  const originalVersion = agent.config.skillBinding?.version ?? '';
  const dirty =
    skill !== originalSkill || mode !== originalMode || (mode === 'pinned' && version.trim() !== originalVersion);
  const selected = catalog.find((s) => s.name === skill);

  function handleSkillChange(next: string) {
    setSkill(next);
    if (mode === 'pinned') {
      const item = catalog.find((s) => s.name === next);
      if (item) setVersion(item.latestVersion);
    }
  }

  function handleModeChange(nextMode: 'automatic' | 'pinned') {
    setMode(nextMode);
    if (nextMode === 'pinned' && selected) {
      setVersion(selected.latestVersion);
    }
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    if (!skill) {
      setError('Selecciona un skill del catálogo.');
      return;
    }
    setSaving(true);
    try {
      const v = mode === 'pinned' ? version.trim() : '';
      await patchAgentConfig(agent.id, {
        skillBinding: v ? { skill, version: v } : { skill },
      });
      const fresh = await getAgent(agent.id);
      onSaved(fresh);
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el skill binding');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setSkill(originalSkill);
    setMode(originalMode);
    setVersion(originalVersion);
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
          Skill binding guardado correctamente.
        </div>
      )}

      <div>
        <div className="text-sm text-gray-400 mb-1.5">Skill</div>
        <select className={inputCls} value={skill} onChange={(e) => handleSkillChange(e.target.value)}>
          <option value="">— seleccionar —</option>
          {catalog.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-gray-400 mb-1.5">Skill Version</div>
        <div className="space-y-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="versionMode"
              value="automatic"
              checked={mode === 'automatic'}
              onChange={() => handleModeChange('automatic')}
              className="mt-1 w-4 h-4 accent-blue-600"
            />
            <div className="flex-1">
              <div className="text-sm text-gray-200">Automática</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Usa la versión resuelta por el sistema (latest).
              </div>
            </div>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="versionMode"
              value="pinned"
              checked={mode === 'pinned'}
              onChange={() => handleModeChange('pinned')}
              className="mt-1 w-4 h-4 accent-blue-600"
            />
            <div className="flex-1">
              <div className="text-sm text-gray-200 mb-1.5">Fijar versión</div>
              <select
                className={inputCls + ' disabled:opacity-40 disabled:cursor-not-allowed'}
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                disabled={mode !== 'pinned'}
              >
                {selected && <option value={selected.latestVersion}>v{selected.latestVersion} (latest)</option>}
                {version && version !== selected?.latestVersion && (
                  <option value={version}>v{version}</option>
                )}
              </select>
            </div>
          </label>
        </div>
      </div>

      {loadingCatalog && <div className="text-sm text-gray-500">Cargando catálogo de skills...</div>}

      {selected && (
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 space-y-3">
          <div className="text-sm text-gray-300">{selected.description}</div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Latest: v{selected.latestVersion}</span>
            <span>{selected.toolsCount} tools</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.permissions.map((p) => (
              <span
                key={p}
                className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-xs font-mono"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleReset}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
