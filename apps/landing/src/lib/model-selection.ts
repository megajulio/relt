import type { AgentConfig } from './agents';

/**
 * Estrategia de modelo que se ofrece en la UI.
 * `auto` = "Automático (RELT Auto)": no se envía ningún campo de modelo.
 */
export type ModelStrategyChoice = 'auto' | 'single' | 'dual';

/** Estado de selección de modelos del formulario. */
export interface ModelSelection {
  strategy: ModelStrategyChoice;
  reasoningModel: string;
  responseModel: string;
}

/** Subconjunto de `config` para la creación (nunca emite `null`). */
export interface CreateModelConfig {
  modelStrategy?: 'single' | 'dual';
  reasoningModel?: string;
  responseModel?: string;
}

/** PATCH de modelos (permite `null` para limpiar campos). */
export interface ModelPatch {
  modelStrategy?: 'single' | 'dual' | null;
  reasoningModel?: string | null;
  responseModel?: string | null;
}

/** Deriva la selección desde la config persistida (default: auto). */
export function selectionFromConfig(config: AgentConfig): ModelSelection {
  return {
    strategy: config.modelStrategy ?? 'auto',
    reasoningModel: config.reasoningModel ?? '',
    responseModel: config.responseModel ?? '',
  };
}

/**
 * Creación: nunca se manda `null` (el schema de creación no lo admite) y
 * `auto` omite los 3 campos.
 */
export function buildCreateModelConfig(sel: ModelSelection): CreateModelConfig {
  if (sel.strategy === 'single') {
    return { modelStrategy: 'single', responseModel: sel.responseModel };
  }
  if (sel.strategy === 'dual') {
    return {
      modelStrategy: 'dual',
      reasoningModel: sel.reasoningModel,
      responseModel: sel.responseModel,
    };
  }
  return {};
}

/**
 * Edición: solo se envían los campos tocados.
 *
 * - Estrategia → auto: exactamente `{ modelStrategy: null }`.
 * - Estrategia → single: `modelStrategy` + `responseModel`, y `reasoningModel: null`
 *   si existía (deja de aplicar).
 * - Estrategia → dual: `modelStrategy` + ambos modelos.
 * - Misma estrategia: solo el/los modelos cuyo valor cambió. Esto evita reenviar
 *   un `responseModel` intacto que estuviera fuera del catálogo (daría
 *   `model_not_approved`, porque el backend exige aprobación solo por los campos
 *   presentes en el PATCH).
 */
export function buildModelPatch(original: ModelSelection, next: ModelSelection): ModelPatch {
  if (next.strategy !== original.strategy) {
    if (next.strategy === 'auto') {
      return { modelStrategy: null };
    }
    if (next.strategy === 'single') {
      const patch: ModelPatch = {
        modelStrategy: 'single',
        responseModel: next.responseModel,
      };
      if (original.reasoningModel) patch.reasoningModel = null;
      return patch;
    }
    return {
      modelStrategy: 'dual',
      reasoningModel: next.reasoningModel,
      responseModel: next.responseModel,
    };
  }

  const patch: ModelPatch = {};
  if (next.strategy === 'single') {
    if (next.responseModel !== original.responseModel) {
      patch.responseModel = next.responseModel;
    }
  } else if (next.strategy === 'dual') {
    if (next.reasoningModel !== original.reasoningModel) {
      patch.reasoningModel = next.reasoningModel;
    }
    if (next.responseModel !== original.responseModel) {
      patch.responseModel = next.responseModel;
    }
  }
  return patch;
}
