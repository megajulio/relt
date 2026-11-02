'use client';

import { useEffect, useState } from 'react';
import { getAgent, patchAgentConfig, type AgentConfigPatch, type AgentDetail } from '@/lib/agents';
import {
  buildModelPatch,
  selectionFromConfig,
  type ModelStrategyChoice,
} from '@/lib/model-selection';
import {
  isModelInCatalog,
  listModels,
  modelOptionValues,
  optionsForField,
  resolveModelErrorField,
  type ModelCatalogItem,
} from '@/lib/models';

const inputCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500';

const TONES = ['proactive', 'reactive', 'neutral', 'formal'] as const;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm text-gray-400 mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-xs text-gray-600 mt-1">{hint}</div>}
    </div>
  );
}

function AgentConfigFormContent({
  agent,
  onSaved,
}: {
  agent: AgentDetail;
  onSaved: (a: AgentDetail) => void;
}) {
  const initialModel = selectionFromConfig(agent.config);
  const [maxSteps, setMaxSteps] = useState<string>(String(agent.config.maxSteps ?? ''));
  const [strategy, setStrategy] = useState<ModelStrategyChoice>(initialModel.strategy);
  const [reasoningModel, setReasoningModel] = useState(initialModel.reasoningModel);
  const [responseModel, setResponseModel] = useState(initialModel.responseModel);
  const [tone, setTone] = useState<string>(agent.config.tone ?? 'neutral');
  const [systemPrompt, setSystemPrompt] = useState(agent.config.systemPrompt ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [models, setModels] = useState<ModelCatalogItem[]>([]);
  const [errorField, setErrorField] = useState<'reasoningModel' | 'responseModel' | null>(null);

  const hasTools = (agent.config.toolBindings?.length ?? 0) > 0;

  useEffect(() => {
    let cancelled = false;

    listModels()
      .then((items) => {
        if (!cancelled) setModels(items);
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);


  const originalModel = selectionFromConfig(agent.config);
  const original = {
    maxSteps: String(agent.config.maxSteps ?? ''),
    tone: agent.config.tone ?? 'neutral',
    systemPrompt: agent.config.systemPrompt ?? '',
  };

  const dirty =
    maxSteps !== original.maxSteps ||
    strategy !== originalModel.strategy ||
    reasoningModel !== originalModel.reasoningModel ||
    responseModel !== originalModel.responseModel ||
    tone !== original.tone ||
    systemPrompt !== original.systemPrompt;

  async function handleSave() {
    setError(null);
    setErrorField(null);
    setSaved(false);

    // Solo campos modificados (merge semantics del backend)
    const patch: AgentConfigPatch = {};
    if (maxSteps !== original.maxSteps) {
      patch.maxSteps = maxSteps === '' ? null : Number(maxSteps);
    }
    Object.assign(
      patch,
      buildModelPatch(originalModel, { strategy, reasoningModel, responseModel }),
    );
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar la configuración');
      const code = (err as { code?: string } | undefined)?.code;
      setErrorField(
        resolveModelErrorField(code, patch, strategy, models, err instanceof Error ? err.message : undefined),
      );
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setMaxSteps(original.maxSteps);
    setStrategy(originalModel.strategy);
    setReasoningModel(originalModel.reasoningModel);
    setResponseModel(originalModel.responseModel);
    setTone(original.tone);
    setSystemPrompt(original.systemPrompt);
    setError(null);
    setErrorField(null);
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
          <select
            aria-label="Model strategy"
            className={inputCls}
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as ModelStrategyChoice)}
          >
            <option value="auto">Automático (RELT Auto)</option>
            <option value="single">single</option>
            <option value="dual">dual</option>
          </select>
        </Field>
        {strategy === 'dual' && (
          <Field label="Reasoning model" hint="Aplica cuando strategy = dual">
            <select
              aria-label="Reasoning model"
              aria-invalid={errorField === 'reasoningModel'}
              className={inputCls}
              value={reasoningModel}
              onChange={(e) => setReasoningModel(e.target.value)}
            >
              <option value="">Seleccioná un modelo…</option>
              {modelOptionValues(
                optionsForField(models, 'dual', 'reasoningModel', hasTools),
                reasoningModel,
              ).map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            {reasoningModel && !isModelInCatalog(models, reasoningModel) && (
              <p className="text-xs text-amber-400 mt-1">
                El modelo guardado «{reasoningModel}» está fuera del catálogo aprobado.
              </p>
            )}
          </Field>
        )}
        {strategy !== 'auto' && (
          <Field label="Response model">
            <select
              aria-label="Response model"
              aria-invalid={errorField === 'responseModel'}
              className={inputCls}
              value={responseModel}
              onChange={(e) => setResponseModel(e.target.value)}
            >
              <option value="">Seleccioná un modelo…</option>
              {modelOptionValues(
                optionsForField(models, strategy, 'responseModel', hasTools),
                responseModel,
              ).map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            {responseModel && !isModelInCatalog(models, responseModel) && (
              <p className="text-xs text-amber-400 mt-1">
                El modelo guardado «{responseModel}» está fuera del catálogo aprobado.
              </p>
            )}
          </Field>
        )}
        <Field label="Tone">
          <select aria-label="Tone" className={inputCls} value={tone} onChange={(e) => setTone(e.target.value)}>
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

export default function AgentConfigForm(props: {
  agent: AgentDetail;
  onSaved: (a: AgentDetail) => void;
}) {
  return <AgentConfigFormContent key={props.agent.id + ':' + props.agent.updatedAt} {...props} />;
}
