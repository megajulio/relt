import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AgentDetail } from '@/lib/agents';
import type { ModelCatalogItem } from '@/lib/models';

const mocks = vi.hoisted(() => ({ listModels: vi.fn() }));

vi.mock('@/lib/models', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/models')>();
  return { ...actual, listModels: mocks.listModels };
});

import AgentConfigForm from '@/components/agent-config-form';

const models: ModelCatalogItem[] = [
  { id: 'openai/gpt-4o', provider: 'openai', aliases: ['gpt-4o'], supportsTools: true, contextWindow: 128000, pricing: { inputPer1M: 2.5, outputPer1M: 10 }, status: 'approved', sourceDate: '2026-11-02' },
  { id: 'openai/gpt-4o-mini', provider: 'openai', aliases: ['gpt-4o-mini'], supportsTools: true, contextWindow: 128000, pricing: { inputPer1M: 0.15, outputPer1M: 0.6 }, status: 'approved', sourceDate: '2026-11-02' },
  { id: 'synthetic/no-tools', provider: 'synthetic', aliases: [], supportsTools: false, contextWindow: 8000, pricing: { inputPer1M: 0, outputPer1M: 0 }, status: 'approved', sourceDate: '2026-11-02' },
  { id: 'legacy/deprecated', provider: 'legacy', aliases: ['old-model'], supportsTools: true, contextWindow: 8000, pricing: { inputPer1M: 0, outputPer1M: 0 }, status: 'deprecated', sourceDate: '2026-11-02' },
];

const optionValues = (el: HTMLElement) =>
  Array.from((el as HTMLSelectElement).options).map((o) => o.value);

/**
 * U3 · En el formulario de edición, con `toolBindings` (tools activas) y
 * estrategia dual:
 * - `reasoningModel` (loop) excluye los modelos sin tools;
 * - `responseModel` de dual queda exento y SÍ los ofrece;
 * - `deprecated` no aparece en ningún lado.
 */
describe('U3 · catálogo en el formulario de edición', () => {
  it('aplica el filtro de tools solo al modelo del loop (dual) y excluye deprecated', async () => {
    mocks.listModels.mockResolvedValue(models);

    const agent: AgentDetail = {
      id: 'agent-tools',
      organizationId: 'org-1',
      key: 'agent-tools',
      name: 'Tools Agent',
      status: 'active',
      defaultSkill: 'general',
      config: {
        modelStrategy: 'dual',
        reasoningModel: 'openai/gpt-4o',
        responseModel: 'openai/gpt-4o-mini',
        toolBindings: ['search'],
        tone: 'neutral',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      bindings: [],
    };

    render(<AgentConfigForm agent={agent} onSaved={() => {}} />);

    // Esperar la carga del catálogo
    await screen.findAllByRole('option', { name: 'openai/gpt-4o' });

    const reasoning = screen.getByLabelText('Reasoning model');
    const response = screen.getByLabelText('Response model');

    const reasoningIds = optionValues(reasoning);
    const responseIds = optionValues(response);

    // loop (dual = reasoningModel) excluye sin-tools; response dual lo incluye
    expect(reasoningIds).not.toContain('synthetic/no-tools');
    expect(responseIds).toContain('synthetic/no-tools');

    // deprecated nunca
    expect(reasoningIds).not.toContain('legacy/deprecated');
    expect(responseIds).not.toContain('legacy/deprecated');
  });
});
