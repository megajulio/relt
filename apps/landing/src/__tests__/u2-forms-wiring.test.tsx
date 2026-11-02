import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { AgentDetail } from '@/lib/agents';

const mocks = vi.hoisted(() => ({
  createAgent: vi.fn(),
  patchAgentConfig: vi.fn(),
  getAgent: vi.fn(),
  push: vi.fn(),
}));

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
vi.mock('@/lib/agents', () => ({
  createAgent: mocks.createAgent,
  patchAgentConfig: mocks.patchAgentConfig,
  getAgent: mocks.getAgent,
}));

import CreateAgentPage from '@/app/dashboard/agents/new/page';
import AgentConfigForm from '@/components/agent-config-form';

/**
 * U2 · Wiring: las páginas usan los builders de payload.
 */
describe('U2 · wiring de formularios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAgent.mockResolvedValue({ id: 'new-agent' });
    mocks.patchAgentConfig.mockResolvedValue(undefined);
    mocks.getAgent.mockResolvedValue(undefined);
  });

  it('crear en Auto: el config omite los 3 campos de modelo', async () => {
    render(<CreateAgentPage />);
    await screen.findByRole('option', { name: 'general' });

    fireEvent.change(screen.getByPlaceholderText('Support Agent'), { target: { value: 'Agente' } });
    fireEvent.change(screen.getByPlaceholderText('support-agent'), { target: { value: 'agente-x' } });
    fireEvent.click(screen.getByRole('button', { name: /create agent/i }));

    await waitFor(() => expect(mocks.createAgent).toHaveBeenCalledTimes(1));
    const input = mocks.createAgent.mock.calls[0][0] as { config: Record<string, unknown> };
    expect(input.config.modelStrategy).toBeUndefined();
    expect(input.config.reasoningModel).toBeUndefined();
    expect(input.config.responseModel).toBeUndefined();
  });

  it('editar en Auto: el PATCH es exactamente { modelStrategy: null }', async () => {
    const agent: AgentDetail = {
      id: 'agent-auto',
      organizationId: 'org-1',
      key: 'agent-auto',
      name: 'Auto Agent',
      status: 'active',
      defaultSkill: 'general',
      config: { modelStrategy: 'single', responseModel: 'openai/gpt-4o-mini', tone: 'neutral' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      bindings: [],
    };

    render(<AgentConfigForm agent={agent} onSaved={() => {}} />);

    const strategy = screen.getByRole('combobox', { name: 'Model strategy' }) as HTMLSelectElement;
    fireEvent.change(strategy, { target: { value: 'auto' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(mocks.patchAgentConfig).toHaveBeenCalledTimes(1));
    expect(mocks.patchAgentConfig.mock.calls[0][1]).toEqual({ modelStrategy: null });
  });
});
