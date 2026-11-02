import { describe, it, expect } from 'vitest';
import {
  buildCreateModelConfig,
  buildModelPatch,
  type ModelSelection,
} from '@/lib/model-selection';

const sel = (
  strategy: ModelSelection['strategy'],
  reasoningModel = '',
  responseModel = '',
): ModelSelection => ({ strategy, reasoningModel, responseModel });

/**
 * U2 · payloads exactos: 3 de creación + 4 de edición.
 * Fuente de verdad del comportamiento Auto/single/dual.
 */
describe('U2 · payloads de modelo (exactos)', () => {
  // ---- Creación: nunca manda null ----
  it('crear en Auto: omite los 3 campos', () => {
    expect(buildCreateModelConfig(sel('auto'))).toEqual({});
  });

  it('crear en single: modelStrategy + responseModel, sin reasoningModel', () => {
    expect(buildCreateModelConfig(sel('single', '', 'openai/gpt-4o-mini'))).toEqual({
      modelStrategy: 'single',
      responseModel: 'openai/gpt-4o-mini',
    });
  });

  it('crear en dual: los 3 campos', () => {
    expect(
      buildCreateModelConfig(sel('dual', 'openai/gpt-6-sol', 'openai/gpt-4o')),
    ).toEqual({
      modelStrategy: 'dual',
      reasoningModel: 'openai/gpt-6-sol',
      responseModel: 'openai/gpt-4o',
    });
  });

  // ---- Edición: solo campos tocados ----
  it('editar en Auto: { modelStrategy: null }', () => {
    expect(
      buildModelPatch(sel('single', '', 'openai/gpt-4o-mini'), sel('auto')),
    ).toEqual({ modelStrategy: null });
  });

  it('dual → single: strategy + response + reasoning null', () => {
    expect(
      buildModelPatch(
        sel('dual', 'openai/gpt-6-sol', 'openai/gpt-4o'),
        sel('single', '', 'openai/gpt-4o-mini'),
      ),
    ).toEqual({
      modelStrategy: 'single',
      responseModel: 'openai/gpt-4o-mini',
      reasoningModel: null,
    });
  });

  it('single → dual: los 3 campos', () => {
    expect(
      buildModelPatch(
        sel('single', '', 'openai/gpt-4o-mini'),
        sel('dual', 'openai/gpt-6-sol', 'openai/gpt-4o'),
      ),
    ).toEqual({
      modelStrategy: 'dual',
      reasoningModel: 'openai/gpt-6-sol',
      responseModel: 'openai/gpt-4o',
    });
  });

  it('dual → dual cambiando solo reasoningModel: { reasoningModel } (sin modelStrategy ni responseModel)', () => {
    expect(
      buildModelPatch(
        sel('dual', 'openai/gpt-6-sol', 'openai/gpt-4o'),
        sel('dual', 'anthropic/claude-sonnet-5.5', 'openai/gpt-4o'),
      ),
    ).toEqual({ reasoningModel: 'anthropic/claude-sonnet-5.5' });
  });
});
