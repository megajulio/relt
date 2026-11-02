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

function makeAgent(): AgentDetail {
  return {
    id: 'agent-u4',
    organizationId: 'org-1',
    key: 'agent-u4',
    name: 'U4 Agent',
    status: 'active',
    defaultSkill: 'general',
    config: {
      modelStrategy: 'single',
      responseModel: 'openai/gpt-4o-mini',
      toolBindings: ['search'],
      tone: 'neutral',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    bindings: [],
  };
}

function makeDualAgent(): AgentDetail {
  return {
    id: 'agent-u4-dual',
    organizationId: 'org-1',
    key: 'agent-u4-dual',
    name: 'U4 Dual Agent',
    status: 'active',
    defaultSkill: 'general',
    config: {
      modelStrategy: 'dual',
      reasoningModel: 'openai/gpt-4o',
      responseModel: 'openai/gpt-4o-mini',
      tone: 'neutral',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    bindings: [],
  };
}

const invalid = (el: HTMLElement) => el.getAttribute('aria-invalid');

describe('U4 · errores visibles en el formulario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listModels.mockResolvedValue(models);
    mocks.getAgent.mockResolvedValue(undefined);
  });

  it('400 con { detail, code, field }: marca el campo (field) y muestra el detalle', async () => {
    mocks.patchAgentConfig.mockRejectedValue(
      Object.assign(new Error('tools no soportadas en este modelo'), {
        code: 'model_tools_unsupported',
        field: 'responseModel',
      }),
    );

    render(<AgentConfigForm agent={makeAgent()} onSaved={() => {}} />);
    await screen.findAllByRole('option', { name: 'openai/gpt-4o' });

    fireEvent.change(screen.getByLabelText('Response model'), { target: { value: 'openai/gpt-4o' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(mocks.patchAgentConfig).toHaveBeenCalled());
    expect(await screen.findByText('tools no soportadas en este modelo')).toBeTruthy();
    expect(invalid(screen.getByLabelText('Response model'))).toBe('true');
  });

  it('el field tipado prevalece: el detail nombra reasoningModel pero field=responseModel → marca responseModel', async () => {
    mocks.patchAgentConfig.mockRejectedValue(
      Object.assign(
        new Error('Model configuration validation failed for reasoningModel: model "x" is not approved'),
        { code: 'model_not_approved', field: 'responseModel' },
      ),
    );

    render(<AgentConfigForm agent={makeDualAgent()} onSaved={() => {}} />);
    await screen.findAllByRole('option', { name: 'openai/gpt-4o' });

    fireEvent.change(screen.getByLabelText('Response model'), { target: { value: 'openai/gpt-4o' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(mocks.patchAgentConfig).toHaveBeenCalled());
    expect(await screen.findByText(/is not approved/)).toBeTruthy();
    expect(invalid(screen.getByLabelText('Response model'))).toBe('true');
    expect(invalid(screen.getByLabelText('Reasoning model'))).not.toBe('true');
  });

  it('400 sin code: muestra el detalle sin marcar campo', async () => {
    mocks.patchAgentConfig.mockRejectedValue(new Error('fallo genérico'));

    render(<AgentConfigForm agent={makeAgent()} onSaved={() => {}} />);
    await screen.findAllByRole('option', { name: 'openai/gpt-4o' });

    fireEvent.change(screen.getByLabelText('Response model'), { target: { value: 'openai/gpt-4o' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(mocks.patchAgentConfig).toHaveBeenCalled());
    expect(await screen.findByText('fallo genérico')).toBeTruthy();
    expect(invalid(screen.getByLabelText('Response model'))).not.toBe('true');
  });
});
