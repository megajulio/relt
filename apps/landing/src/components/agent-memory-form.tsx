'use client';

import { useEffect, useState } from 'react';
import { getAgent, patchAgentConfig, type AgentDetail } from '@/lib/agents';

const inputCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500';

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 accent-blue-600"
      />
      <div>
        <div className="text-sm text-gray-200">{label}</div>
        {hint && <div className="text-xs text-gray-500 mt-0.5">{hint}</div>}
      </div>
    </label>
  );
}

export default function AgentMemoryForm({
  agent,
  onSaved,
}: {
  agent: AgentDetail;
  onSaved: (a: AgentDetail) => void;
}) {
  const [stEnabled, setStEnabled] = useState(agent.config.memory?.shortTerm?.enabled ?? false);
  const [stLimit, setStLimit] = useState<string>(
    agent.config.memory?.shortTerm?.limit != null
      ? String(agent.config.memory.shortTerm.limit)
      : ''
  );
  const [sumEnabled, setSumEnabled] = useState(agent.config.memory?.summary?.enabled ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStEnabled(agent.config.memory?.shortTerm?.enabled ?? false);
    setStLimit(
      agent.config.memory?.shortTerm?.limit != null
        ? String(agent.config.memory.shortTerm.limit)
        : ''
    );
    setSumEnabled(agent.config.memory?.summary?.enabled ?? false);
  }, [agent.id, agent.updatedAt]);

  const origStEnabled = agent.config.memory?.shortTerm?.enabled ?? false;
  const origStLimit =
    agent.config.memory?.shortTerm?.limit != null
      ? String(agent.config.memory.shortTerm.limit)
      : '';
  const origSumEnabled = agent.config.memory?.summary?.enabled ?? false;
  const dirty =
    stEnabled !== origStEnabled || stLimit.trim() !== origStLimit || sumEnabled !== origSumEnabled;

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      // Siempre se envía el objeto memory COMPLETO (shortTerm + summary):
      // seguro ante merge shallow o deep del backend.
      const limitRaw = stLimit.trim();
      const shortTerm: { enabled?: boolean; limit?: number } = { enabled: stEnabled };
      if (stEnabled && limitRaw !== '') shortTerm.limit = Number(limitRaw);
      await patchAgentConfig(agent.id, {
        memory: { shortTerm, summary: { enabled: sumEnabled } },
      });
      const fresh = await getAgent(agent.id);
      onSaved(fresh);
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || 'Error al guardar memory configuration');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setStEnabled(origStEnabled);
    setStLimit(origStLimit);
    setSumEnabled(origSumEnabled);
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
          Memory configuration guardada correctamente.
        </div>
      )}

      <div className="space-y-4">
        <Toggle
          label="Short-term memory"
          hint="Ventana de mensajes recientes inyectada al contexto del LLM"
          checked={stEnabled}
          onChange={setStEnabled}
        />
        <div className="pl-7">
          <div className="text-sm text-gray-400 mb-1.5">Message limit</div>
          <input
            type="number"
            className={inputCls + ' disabled:opacity-40 disabled:cursor-not-allowed max-w-[160px]'}
            value={stLimit}
            onChange={(e) => setStLimit(e.target.value)}
            disabled={!stEnabled}
            placeholder="ej: 10"
          />
          <div className="text-xs text-gray-600 mt-1">
            Entero positivo (validado por Zod server-side). Vacío = sin límite explícito.
          </div>
        </div>
        <Toggle
          label="Summary generation"
          hint="Resumen acumulativo de la conversación para contexto de largo plazo"
          checked={sumEnabled}
          onChange={setSumEnabled}
        />
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
        El PATCH envía el objeto memory completo (shortTerm + summary) para ser seguro ante la
        semántica de merge del backend. La validación final es Zod server-side.
      </p>
    </div>
  );
}
