import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ModelCatalogItem } from '@/lib/models';

const mocks = vi.hoisted(() => ({ createAgent: vi.fn(), listModels: vi.fn(), push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={typeof href === 'string' ? href : '#'}>{children}</a>
  ),
}));
vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({}),
}));
vi.mock('@/lib/skills', () => ({
  listSkills: () =>
    Promise.resolve([
      { name: 'general', latestVersion: '1.0.0', description: '', toolsCount: 0, permissions: [], triggers: [] },
    ]),
}));
vi.mock('@/lib/models', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/models')>();
  return { ...actual, listModels: mocks.listModels };
});
vi.mock('@/lib/agents', () => ({ createAgent: mocks.createAgent }));

import CreateAgentPage from '@/app/dashboard/agents/new/page';

const models: ModelCatalogItem[] = [
  { id: 'openai/gpt-4o', provider: 'openai', aliases: ['gpt-4o'], supportsTools: true, contextWindow: 128000, pricing: { inputPer1M: 2.5, outputPer1M: 10 }, status: 'approved', sourceDate: '2026-11-02' },
  { id: 'openai/gpt-4o-mini', provider: 'openai', aliases: ['gpt-4o-mini'], supportsTools: true, contextWindow: 128000, pricing: { inputPer1M: 0.15, outputPer1M: 0.6 }, status: 'approved', sourceDate: '2026-11-02' },
];

const invalid = (el: HTMLElement) => el.getAttribute('aria-invalid');

async function fillBasics() {
  render(<CreateAgentPage />);
  await screen.findByRole('option', { name: 'general' });
  fireEvent.change(screen.getByPlaceholderText('Support Agent'), { target: { value: 'Agente C' } });
  fireEvent.change(screen.getByPlaceholderText('support-agent'), { target: { value: 'agente-c' } });
}

describe('C · marcado de campo en errores de creación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listModels.mockResolvedValue(models);
  });

  it('400 model_not_approved: marca responseModel (vía detail) y muestra el mensaje', async () => {
    mocks.createAgent.mockRejectedValue(
      Object.assign(
        new Error('Model configuration validation failed for responseModel: model "x" is not approved'),
        { code: 'model_not_approved', field: 'responseModel' },
      ),
    );

    await fillBasics();
    fireEvent.change(screen.getByLabelText('Model strategy'), { target: { value: 'single' } });
    fireEvent.change(screen.getByLabelText('Response model'), { target: { value: 'openai/gpt-4o-mini' } });
    fireEvent.click(screen.getByRole('button', { name: /create agent/i }));

    await waitFor(() => expect(mocks.createAgent).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/is not approved/)).toBeTruthy();
    expect(invalid(screen.getByLabelText('Response model'))).toBe('true');
  });

  it('400 incomplete (dual sin reasoningModel): marca reasoningModel y muestra el detail', async () => {
    mocks.createAgent.mockRejectedValue(
      Object.assign(
        new Error('Model configuration validation failed for reasoningModel: required by dual strategy'),
        { code: 'incomplete', field: 'reasoningModel' },
      ),
    );

    await fillBasics();
    fireEvent.change(screen.getByLabelText('Model strategy'), { target: { value: 'dual' } });
    fireEvent.change(screen.getByLabelText('Response model'), { target: { value: 'openai/gpt-4o-mini' } });
    fireEvent.click(screen.getByRole('button', { name: /create agent/i }));

    await waitFor(() => expect(mocks.createAgent).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/required by dual strategy/)).toBeTruthy();
    expect(invalid(screen.getByLabelText('Reasoning model'))).toBe('true');
  });
});
