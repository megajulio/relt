import { api } from './api';

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
