import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { AgentDetail } from '@/lib/agents';
import type { ModelCatalogItem } from '@/lib/models';

const mocks = vi.hoisted(() => ({
  listModels: vi.fn(),
  patchAgentConfig: vi.fn(),
  getAgent: vi.fn(),
}));

vi.mock('@/lib/models', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/models')>();
  return { ...actual, listModels: mocks.listModels };
});
vi.mock('@/lib/agents', () => ({
  patchAgentConfig: mocks.patchAgentConfig,
  getAgent: mocks.getAgent,
}));

import AgentConfigForm from '@/components/agent-config-form';

const models: ModelCatalogItem[] = [
  { id: 'openai/gpt-4o', provider: 'openai', aliases: ['gpt-4o'], supportsTools: true, contextWindow: 128000, pricing: { inputPer1M: 2.5, outputPer1M: 10 }, status: 'approved', sourceDate: '2026-11-02' },
  { id: 'openai/gpt-4o-mini', provider: 'openai', aliases: ['gpt-4o-mini'], supportsTools: true, contextWindow: 128000, pricing: { inputPer1M: 0.15, outputPer1M: 0.6 }, status: 'approved', sourceDate: '2026-11-02' },
];

function agentWith(responseModel: string): AgentDetail {
  return {
    id: 'agent-u5',
    organizationId: 'org-1',
    key: 'agent-u5',
    name: 'U5 Agent',
    status: 'active',
    defaultSkill: 'general',
    config: { modelStrategy: 'single', responseModel, tone: 'neutral' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    bindings: [],
  };
}

const optionValues = (el: HTMLElement) =>
  Array.from((el as HTMLSelectElement).options).map((o) => o.value);
const warning = () => screen.queryByText(/fuera del catálogo/i);

describe('U5 · aviso de modelo fuera del catálogo ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listModels.mockResolvedValue(models);
    mocks.getAgent.mockResolvedValue(undefined);
    mocks.patchAgentConfig.mockResolvedValue(undefined);
  });

  it('alias cortos (gpt-4o) NO muestran el aviso y siguen visibles', async () => {
    render(<AgentConfigForm agent={agentWith('gpt-4o')} onSaved={() => {}} />);
    await screen.findAllByRole('option', { name: 'openai/gpt-4o' });

    const response = screen.getByLabelText('Response model') as HTMLSelectElement;
    expect(response.value).toBe('gpt-4o');
    expect(optionValues(response)).toContain('gpt-4o');
    expect(warning()).toBeNull();
  });

  it('un modelo inventado SÍ muestra el aviso y sigue visible', async () => {
    render(<AgentConfigForm agent={agentWith('invented/model')} onSaved={() => {}} />);
    await screen.findAllByRole('option', { name: 'openai/gpt-4o' });

    const response = screen.getByLabelText('Response model') as HTMLSelectElement;
    expect(response.value).toBe('invented/model');
    expect(optionValues(response)).toContain('invented/model');
    expect(warning()).not.toBeNull();
  });

  it('con un agente fuera del catálogo, cambiar solo tone NO manda campos de modelo', async () => {
    render(<AgentConfigForm agent={agentWith('invented/model')} onSaved={() => {}} />);
    await screen.findAllByRole('option', { name: 'openai/gpt-4o' });

    fireEvent.change(screen.getByLabelText('Tone'), { target: { value: 'formal' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(mocks.patchAgentConfig).toHaveBeenCalledTimes(1));
    expect(mocks.patchAgentConfig.mock.calls[0][1]).toEqual({ tone: 'formal' });
  });
});
