import { describe, it, expect } from 'vitest';
import { optionsForField, isModelInCatalog, type ModelCatalogItem } from '@/lib/models';

/**
 * Catálogo de prueba: incluye un modelo sintético SIN tools y uno deprecated.
 * Los 5 modelos aprobados reales tienen `supports_tools: true`, así que el
 * filtro de tools sólo se puede ejercitar con un modelo sintético.
 */
const models: ModelCatalogItem[] = [
  { id: 'openai/gpt-4o', provider: 'openai', aliases: ['gpt-4o'], supportsTools: true, contextWindow: 128000, pricing: { inputPer1M: 2.5, outputPer1M: 10 }, status: 'approved', sourceDate: '2026-11-02' },
  { id: 'openai/gpt-4o-mini', provider: 'openai', aliases: ['gpt-4o-mini'], supportsTools: true, contextWindow: 128000, pricing: { inputPer1M: 0.15, outputPer1M: 0.6 }, status: 'approved', sourceDate: '2026-11-02' },
  { id: 'synthetic/no-tools', provider: 'synthetic', aliases: [], supportsTools: false, contextWindow: 8000, pricing: { inputPer1M: 0, outputPer1M: 0 }, status: 'approved', sourceDate: '2026-11-02' },
  { id: 'legacy/deprecated', provider: 'legacy', aliases: ['old-model'], supportsTools: true, contextWindow: 8000, pricing: { inputPer1M: 0, outputPer1M: 0 }, status: 'deprecated', sourceDate: '2026-11-02' },
];

const ids = (list: ModelCatalogItem[]) => list.map((m) => m.id);
const STRATEGIES = ['single', 'dual'] as const;
const FIELDS = ['reasoningModel', 'responseModel'] as const;

describe('U3 · opciones del catálogo por campo', () => {
  it('deprecated no aparece en ningún lado', () => {
    for (const s of STRATEGIES) {
      for (const f of FIELDS) {
        for (const hasTools of [false, true]) {
          expect(ids(optionsForField(models, s, f, hasTools))).not.toContain('legacy/deprecated');
        }
      }
    }
  });

  it('single: el modelo del loop (responseModel) excluye los sin tools cuando hay tools', () => {
    const opts = ids(optionsForField(models, 'single', 'responseModel', true));
    expect(opts).not.toContain('synthetic/no-tools');
    expect(opts).toContain('openai/gpt-4o');
  });

  it('dual: el modelo del loop (reasoningModel) excluye los sin tools cuando hay tools', () => {
    const opts = ids(optionsForField(models, 'dual', 'reasoningModel', true));
    expect(opts).not.toContain('synthetic/no-tools');
  });

  it('dual: el responseModel queda EXENTO del filtro de tools', () => {
    const opts = ids(optionsForField(models, 'dual', 'responseModel', true));
    expect(opts).toContain('synthetic/no-tools');
  });

  it('sin tools el filtro no aplica', () => {
    expect(ids(optionsForField(models, 'single', 'responseModel', false))).toContain(
      'synthetic/no-tools',
    );
  });

  it('pertenencia al catálogo = id ∪ aliases', () => {
    expect(isModelInCatalog(models, 'gpt-4o')).toBe(true);
    expect(isModelInCatalog(models, 'gpt-4o-mini')).toBe(true);
    expect(isModelInCatalog(models, 'openai/gpt-4o')).toBe(true);
    expect(isModelInCatalog(models, 'invented/model')).toBe(false);
  });
});
