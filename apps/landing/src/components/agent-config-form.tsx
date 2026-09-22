'use client';

import { useEffect, useState } from 'react';
import { getAgent, patchAgentConfig, type AgentConfigPatch, type AgentDetail } from '@/lib/agents';

const inputCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500';

const TONES = ['proactive', 'reactive', 'neutral', 'formal'] as const;
const STRATEGIES = ['dual', 'single'] as const;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm text-gray-400 mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-xs text-gray-600 mt-1">{hint}</div>}
    </div>
  );
}

export default function AgentConfigForm({
  agent,
  onSaved,
}: {
  agent: AgentDetail;
  onSaved: (a: AgentDetail) => void;
}) {
  const [maxSteps, setMaxSteps] = useState<string>(String(agent.config.maxSteps ?? ''));
  const [modelStrategy, setModelStrategy] = useState<string>(agent.config.modelStrategy ?? 'single');
  const [reasoningModel, setReasoningModel] = useState(agent.config.reasoningModel ?? '');
  const [responseModel, setResponseModel] = useState(agent.config.responseModel ?? '');
  const [tone, setTone] = useState<string>(agent.config.tone ?? 'neutral');
  const [systemPrompt, setSystemPrompt] = useState(agent.config.systemPrompt ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Resincronizar el form cuando el agent cambia (refetch post-save)
  useEffect(() => {
    setMaxSteps(String(agent.config.maxSteps ?? ''));
    setModelStrategy(agent.config.modelStrategy ?? 'single');
    setReasoningModel(agent.config.reasoningModel ?? '');
    setResponseModel(agent.config.responseModel ?? '');
    setTone(agent.config.tone ?? 'neutral');
    setSystemPrompt(agent.config.systemPrompt ?? '');
    setError(null);
  }, [agent.id, agent.updatedAt]);

  const original = {
    maxSteps: String(agent.config.maxSteps ?? ''),
    modelStrategy: agent.config.modelStrategy ?? 'single',
    reasoningModel: agent.config.reasoningModel ?? '',
    responseModel: agent.config.responseModel ?? '',
    tone: agent.config.tone ?? 'neutral',
    systemPrompt: agent.config.systemPrompt ?? '',
  };

  const dirty =
    maxSteps !== original.maxSteps ||
    modelStrategy !== original.modelStrategy ||
    reasoningModel !== original.reasoningModel ||
    responseModel !== original.responseModel ||
    tone !== original.tone ||
    systemPrompt !== original.systemPrompt;

  async function handleSave() {
    setError(null);
    setSaved(false);

    // Solo campos modificados (merge semantics del backend)
    const patch: AgentConfigPatch = {};
    if (maxSteps !== original.maxSteps) {
      patch.maxSteps = maxSteps === '' ? null : Number(maxSteps);
    }
    if (modelStrategy !== original.modelStrategy) {
      patch.modelStrategy = modelStrategy as 'dual' | 'single';
    }
    if (reasoningModel !== original.reasoningModel) patch.reasoningModel = reasoningModel;
    if (responseModel !== original.responseModel) patch.responseModel = responseModel;
    if (tone !== original.tone) patch.tone = tone as AgentConfigPatch['tone'];
    if (systemPrompt !== original.systemPrompt) patch.systemPrompt = systemPrompt;

    if (Object.keys(patch).length === 0) return;

    setSaving(true);
    try {
      await patchAgentConfig(agent.id, patch);
      // Source of truth: re-fetch del backend (Effective Configuration real)
      const fresh = await getAgent(agent.id);
      onSaved(fresh);
      setSaved(true);
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setMaxSteps(original.maxSteps);
    setModelStrategy(original.modelStrategy);
    setReasoningModel(original.reasoningModel);
    setResponseModel(original.responseModel);
    setTone(original.tone);
    setSystemPrompt(original.systemPrompt);
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
          Configuración guardada correctamente.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Max steps" hint="Entero positivo (validado por Zod server-side)">
          <input
            type="number"
            className={inputCls}
            value={maxSteps}
            onChange={(e) => setMaxSteps(e.target.value)}
          />
        </Field>
        <Field label="Model strategy">
          <select className={inputCls} value={modelStrategy} onChange={(e) => setModelStrategy(e.target.value)}>
            {STRATEGIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reasoning model" hint="Aplica cuando strategy = dual">
          <input
            type="text"
            className={inputCls}
            value={reasoningModel}
            onChange={(e) => setReasoningModel(e.target.value)}
            placeholder="ej: openai/o3-mini"
          />
        </Field>
        <Field label="Response model">
          <input
            type="text"
            className={inputCls}
            value={responseModel}
            onChange={(e) => setResponseModel(e.target.value)}
            placeholder="ej: openai/gpt-4o-mini"
          />
        </Field>
        <Field label="Tone">
          <select className={inputCls} value={tone} onChange={(e) => setTone(e.target.value)}>
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="System prompt">
        <textarea
          rows={6}
          className={inputCls}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Instrucciones de sistema del agent..."
        />
      </Field>

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
        Merge semantics: solo se envían los campos modificados. La validación final (Zod) y la
        construcción de la Effective Configuration ocurren server-side.
      </p>
    </div>
  );
}
