import { describe, it, expect } from 'vitest';
import { resolveModelErrorField, type ModelCatalogItem } from '@/lib/models';

const models: ModelCatalogItem[] = [
  { id: 'openai/gpt-4o', provider: 'openai', aliases: ['gpt-4o'], supportsTools: true, contextWindow: 128000, pricing: { inputPer1M: 2.5, outputPer1M: 10 }, status: 'approved', sourceDate: '2026-11-02' },
  { id: 'openai/gpt-4o-mini', provider: 'openai', aliases: ['gpt-4o-mini'], supportsTools: true, contextWindow: 128000, pricing: { inputPer1M: 0.15, outputPer1M: 0.6 }, status: 'approved', sourceDate: '2026-11-02' },
];

describe('U4 · campo de modelo a marcar según el code y el field tipado', () => {
  it('usa el `field` tipado; prevalece sobre el texto del mensaje', () => {
    // El mensaje nombra reasoningModel, pero el `field` tipado es responseModel.
    expect(
      resolveModelErrorField(
        'model_not_approved',
        { reasoningModel: 'openai/gpt-4o', responseModel: 'ghost/model' },
        'dual',
        models,
        'responseModel',
      ),
    ).toBe('responseModel');
    expect(resolveModelErrorField('incomplete', {}, 'dual', models, 'reasoningModel')).toBe(
      'reasoningModel',
    );
    expect(resolveModelErrorField('invalid_model', {}, 'dual', models, 'modelStrategy')).toBe(
      'modelStrategy',
    );
  });

  it('un `field` inválido (dato no confiable) se ignora', () => {
    expect(resolveModelErrorField('incomplete', {}, 'dual', models, 'garbage')).toBeNull();
    expect(
      resolveModelErrorField('model_not_approved', { responseModel: 'openai/gpt-4o' }, 'single', models, 'nope'),
    ).toBeNull();
  });

  it('model_not_approved sin field: fallback por catálogo (id ∪ aliases)', () => {
    expect(
      resolveModelErrorField('model_not_approved', { responseModel: 'ghost/model' }, 'single', models),
    ).toBe('responseModel');
    expect(
      resolveModelErrorField(
        'model_not_approved',
        { reasoningModel: 'ghost/model', responseModel: 'openai/gpt-4o' },
        'dual',
        models,
      ),
    ).toBe('reasoningModel');
    expect(
      resolveModelErrorField('model_not_approved', { responseModel: 'openai/gpt-4o' }, 'single', models),
    ).toBeNull();
  });

  it('model_tools_unsupported sin field: campo del loop', () => {
    expect(
      resolveModelErrorField('model_tools_unsupported', { responseModel: 'openai/gpt-4o' }, 'single', models),
    ).toBe('responseModel');
    expect(
      resolveModelErrorField('model_tools_unsupported', { reasoningModel: 'openai/gpt-4o' }, 'dual', models),
    ).toBe('reasoningModel');
  });

  it('incomplete / invalid_model sin field: no marcan campo', () => {
    expect(resolveModelErrorField('incomplete', {}, 'single', models)).toBeNull();
    expect(resolveModelErrorField('invalid_model', {}, 'single', models)).toBeNull();
    expect(resolveModelErrorField(undefined, {}, 'single', models)).toBeNull();
  });
});
