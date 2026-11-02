import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AgentDetail } from '@/lib/agents';
import type { ModelCatalogItem } from '@/lib/models';

const mocks = vi.hoisted(() => ({
  listModels: vi.fn(),
  getAgent: vi.fn(),
  patchAgentConfig: vi.fn(),
}));

vi.mock('@/lib/models', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/models')>();
  return { ...actual, listModels: mocks.listModels };
});
vi.mock('@/lib/agents', () => ({
  getAgent: mocks.getAgent,
  patchAgentConfig: mocks.patchAgentConfig,
}));

import AgentConfigForm from '@/components/agent-config-form';

const models: ModelCatalogItem[] = [
  { id: 'openai/gpt-4o', provider: 'openai', aliases: ['gpt-4o'], supportsTools: true, contextWindow: 128000, pricing: { inputPer1M: 2.5, outputPer1M: 10 }, status: 'approved', sourceDate: '2026-11-02' },
  { id: 'openai/gpt-4o-mini', provider: 'openai', aliases: ['gpt-4o-mini'], supportsTools: true, contextWindow: 128000, pricing: { inputPer1M: 0.15, outputPer1M: 0.6 }, status: 'approved', sourceDate: '2026-11-02' },
];

function makeAgent(updatedAt: string, responseModel: string): AgentDetail {
  return {
    id: 'agent-resync',
    organizationId: 'org-1',
    key: 'agent-resync',
    name: 'Resync Agent',
    status: 'active',
    defaultSkill: 'general',
    config: { modelStrategy: 'single', responseModel, tone: 'neutral' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt,
    bindings: [],
  };
}

/**
 * B · El wrapper con `key={agent.id + ':' + agent.updatedAt}` re-sincroniza el
 * formulario cuando el agente cambia (mismo id, nuevo updatedAt y valores de
 * modelo distintos).
 */
describe('B · resync del formulario al cambiar de agente', () => {
  it('con el mismo id y un updatedAt nuevo, muestra los valores nuevos', async () => {
    mocks.listModels.mockResolvedValue(models);

    const { rerender } = render(
      <AgentConfigForm agent={makeAgent('2026-01-01T00:00:00.000Z', 'openai/gpt-4o')} onSaved={() => {}} />,
    );
    await screen.findAllByRole('option', { name: 'openai/gpt-4o' });
    expect((screen.getByLabelText('Response model') as HTMLSelectElement).value).toBe('openai/gpt-4o');

    rerender(
      <AgentConfigForm agent={makeAgent('2026-01-02T00:00:00.000Z', 'openai/gpt-4o-mini')} onSaved={() => {}} />,
    );
    expect((screen.getByLabelText('Response model') as HTMLSelectElement).value).toBe('openai/gpt-4o-mini');
  });
});
