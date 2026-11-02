import { api, isModelErrorField, type ModelErrorField } from './api';

/** Estado de un modelo dentro del catálogo (backend). */
export type ModelStatus = 'approved' | 'deprecated';

/** Modelo del catálogo aprobado (forma de la UI). */
export interface ModelCatalogItem {
  id: string;
  provider: string;
  aliases: string[];
  supportsTools: boolean;
  contextWindow: number;
  pricing: { inputPer1M: number; outputPer1M: number };
  status: ModelStatus;
  sourceDate: string;
}

interface BackendModel {
  id: string;
  provider: string;
  aliases: string[];
  supports_tools: boolean;
  context_window: number;
  pricing: { input_per_1m: number; output_per_1m: number };
  status: ModelStatus;
  source_date: string;
}

/** Campo de modelo del formulario. */
export type ModelField = 'reasoningModel' | 'responseModel';

/** `GET /control/v1/models` — catálogo de modelos aprobados. */
export async function listModels(): Promise<ModelCatalogItem[]> {
  const res = await api.get<{ models: BackendModel[] }>('/control/v1/models');
  return res.models.map((m) => ({
    id: m.id,
    provider: m.provider,
    aliases: m.aliases,
    supportsTools: m.supports_tools,
    contextWindow: m.context_window,
    pricing: { inputPer1M: m.pricing.input_per_1m, outputPer1M: m.pricing.output_per_1m },
    status: m.status,
    sourceDate: m.source_date,
  }));
}

/** Pertenencia al catálogo = id ∪ aliases. */
export function isModelInCatalog(models: ModelCatalogItem[], value: string): boolean {
  if (!value) return false;
  return models.some((m) => m.id === value || m.aliases.includes(value));
}

/**
 * Valores para un `<select>`: los ids ofrecidos, más el valor actual si no está
 * entre ellos (para que un modelo legacy/alias/fuera de catálogo siga visible).
 */
export function modelOptionValues(options: ModelCatalogItem[], current: string): string[] {
  const ids = options.map((m) => m.id);
  if (current && !ids.includes(current)) {
    return [current, ...ids];
  }
  return ids;
}

/** Campo de modelo que debe marcarse ante un error del backend. */
export type ModelErrorTarget = ModelErrorField | null;

/**
 * Determina qué campo de modelo marcar según el `code` del 400 y el `field`
 * tipado del backend (dato, no texto del mensaje). `field`, cuando es válido,
 * prevalece. Si falta:
 * - `model_not_approved`: fallback por catálogo (campo enviado fuera de
 *   `id ∪ aliases`);
 * - `model_tools_unsupported`: campo del loop (`responseModel` en single,
 *   `reasoningModel` en dual);
 * - `incomplete` / `invalid_model` / otros: ningún campo.
 */
export function resolveModelErrorField(
  code: string | undefined,
  sent: { reasoningModel?: string | null; responseModel?: string | null },
  strategy: 'auto' | 'single' | 'dual',
  models: ModelCatalogItem[],
  field?: string,
): ModelErrorTarget {
  const typed: ModelErrorTarget = isModelErrorField(field) ? field : null;

  if (code === 'model_not_approved') {
    if (typed) return typed;
    if (
      typeof sent.reasoningModel === 'string' &&
      sent.reasoningModel &&
      !isModelInCatalog(models, sent.reasoningModel)
    ) {
      return 'reasoningModel';
    }
    if (
      typeof sent.responseModel === 'string' &&
      sent.responseModel &&
      !isModelInCatalog(models, sent.responseModel)
    ) {
      return 'responseModel';
    }
    return null;
  }

  if (code === 'model_tools_unsupported') {
    if (typed) return typed;
    if (strategy === 'single') return 'responseModel';
    if (strategy === 'dual') return 'reasoningModel';
    return null;
  }

  // incomplete / invalid_model / otros: solo si llega un `field` válido.
  return typed;
}

/**
 * ¿El campo es el "modelo del loop" para la estrategia dada?
 * - single: el loop usa `responseModel`.
 * - dual:   el loop usa `reasoningModel` (el `responseModel` de dual queda
 *           exento, porque la llamada final va sin tools).
 */
function isLoopField(strategy: 'single' | 'dual', field: ModelField): boolean {
  return strategy === 'single' ? field === 'responseModel' : field === 'reasoningModel';
}

/**
 * Modelos ofrecibles para un campo concreto:
 * - solo `status === 'approved'`;
 * - si el agente tiene tools y el campo es el del loop → solo `supportsTools`.
 */
export function optionsForField(
  models: ModelCatalogItem[],
  strategy: 'single' | 'dual',
  field: ModelField,
  hasTools: boolean,
): ModelCatalogItem[] {
  const loop = hasTools && isLoopField(strategy, field);
  return models.filter((m) => m.status === 'approved' && (!loop || m.supportsTools));
}
