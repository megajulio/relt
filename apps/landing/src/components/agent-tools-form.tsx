'use client';

import { useEffect, useState } from 'react';
import {
  getAgent,
  listTools,
  patchAgentConfig,
  type AgentDetail,
  type ToolCatalogItem,
} from '@/lib/agents';

export default function AgentToolsForm({
  agent,
  onSaved,
}: {
  agent: AgentDetail;
  onSaved: (a: AgentDetail) => void;
}) {
  const [catalog, setCatalog] = useState<ToolCatalogItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [checked, setChecked] = useState<string[]>(agent.config.toolBindings ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    listTools()
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setLoadingCatalog(false));
  }, []);

  useEffect(() => {
    setChecked(agent.config.toolBindings ?? []);
  }, [agent.id, agent.updatedAt]);

  const original = agent.config.toolBindings ?? [];
  const dirty = checked.length !== original.length || checked.some((t) => !original.includes(t));

  function toggle(name: string) {
    setChecked((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]));
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await patchAgentConfig(agent.id, { toolBindings: checked });
      const fresh = await getAgent(agent.id);
      onSaved(fresh);
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || 'Error al guardar tool bindings');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setChecked(original);
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
          Tool bindings guardados correctamente.
        </div>
      )}

      {loadingCatalog && <div className="text-sm text-gray-500">Cargando catálogo de tools...</div>}

      {!loadingCatalog && catalog.length === 0 && (
        <div className="text-sm text-gray-400">No hay tools registradas en la plataforma.</div>
      )}

      <div className="space-y-3">
        {catalog.map((tool) => {
          const isChecked = checked.includes(tool.name);
          return (
            <label
              key={tool.name}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                isChecked
                  ? 'bg-blue-500/5 border-blue-500/30'
                  : 'bg-gray-950 border-gray-800 hover:border-gray-700'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(tool.name)}
                className="mt-1 w-4 h-4 accent-blue-600"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-200 font-mono">{tool.name}</div>
                <div className="text-xs text-gray-500 mt-1">{tool.description}</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tool.permissions.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-xs font-mono">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </label>
          );
        })}
      </div>

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

      <p className="text-xs text-gray-600">
        F.8: lo marcado aquí define <span className="font-mono">toolBindings</span>. El Runtime
        autoriza en ejecución exactamente este conjunto; desmarcar una tool la hace inejecutable
        para este Agent sin tocar código.
      </p>
    </div>
  );
}
