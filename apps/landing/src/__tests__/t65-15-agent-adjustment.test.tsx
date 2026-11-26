import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';

/**
 * T65-15 (ORDEN-65 · Bloque 2 · ANEXO-65-B · N5/A-5) — alta y detalle del agente.
 *
 * Criterios: el campo se llama «Ajuste de este agente» (con su ayuda y el enlace a
 * la página), en el alta empieza VACÍO y editar otra cosa no borra ni cambia
 * `config.systemPrompt`.
 */

const HELP_ES =
  'Solo para este agente. Se suma a las Instrucciones del negocio; si se contradicen, vale este ajuste.';

const SKILLS = [
  {
    name: 'general',
    latest_version: '1.0.0',
    description: 'General',
    tools_count: 1,
    permissions: ['products:read'],
    triggers: [],
    kind: 'repo',
    tools: ['products.search'],
  },
];

const AGENT = {
  id: 'a1',
  organizationId: 'o1',
  key: 'k',
  name: 'A',
  status: 'active' as const,
  defaultSkill: 'general',
  config: { systemPrompt: 'ajuste guardado', tone: 'neutral' as const },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  bindings: [],
};

const createAgent = vi.fn();
const getAgent = vi.fn();
const patchAgentConfig = vi.fn();

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({}),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/lib/agents', () => ({
  createAgent: (...args: unknown[]) => createAgent(...args),
  getAgent: (...args: unknown[]) => getAgent(...args),
  patchAgentConfig: (...args: unknown[]) => patchAgentConfig(...args),
}));
vi.mock('@/lib/skills', () => ({
  listSkills: vi.fn(async () => SKILLS),
  listSkillsWithTools: vi.fn(async () => SKILLS),
  getSkill: vi.fn(),
  createOrgSkill: vi.fn(),
  patchOrgSkill: vi.fn(),
}));

import CreateAgentPage from '@/app/dashboard/agents/new/page';
import AgentConfigForm from '@/components/agent-config-form';
import { renderWithI18n } from './render-with-i18n';

describe('T65-15 · «Ajuste de este agente» en el alta y en el detalle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAgent.mockResolvedValue({ ...AGENT, config: { ...AGENT.config, tone: 'formal' } });
    patchAgentConfig.mockResolvedValue(undefined);
  });
  afterEach(() => cleanup());

  it('en el alta el campo empieza vacío, con su ayuda y el enlace', async () => {
    renderWithI18n(<CreateAgentPage />, 'es');
    await waitFor(() =>
      expect(screen.queryByLabelText('Ajuste de este agente')).not.toBeNull(),
    );
    const ta = screen.queryByLabelText('Ajuste de este agente') as HTMLTextAreaElement | null;
    expect(ta).not.toBeNull();
    expect((ta as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByText(HELP_ES)).not.toBeNull();
    expect(screen.queryByText('Ver las Instrucciones del negocio')).not.toBeNull();
  });

  it('en el detalle, editar otra cosa NO manda ni cambia systemPrompt', async () => {
    renderWithI18n(<AgentConfigForm agent={AGENT} onSaved={() => {}} />, 'es');
    const ta = screen.queryByLabelText('Ajuste de este agente') as HTMLTextAreaElement | null;
    expect(ta).not.toBeNull();
    expect((ta as HTMLTextAreaElement).value).toBe('ajuste guardado');

    fireEvent.change(screen.getByLabelText('Tono'), { target: { value: 'formal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(patchAgentConfig).toHaveBeenCalledWith('a1', { tone: 'formal' }));
    expect(patchAgentConfig.mock.calls[0][1]).not.toHaveProperty('systemPrompt');
  });

  it('en el detalle, editar el ajuste manda systemPrompt', async () => {
    renderWithI18n(<AgentConfigForm agent={AGENT} onSaved={() => {}} />, 'es');
    fireEvent.change(screen.getByLabelText('Ajuste de este agente'), {
      target: { value: 'Nuevo ajuste' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(patchAgentConfig).toHaveBeenCalledWith('a1', { systemPrompt: 'Nuevo ajuste' }),
    );
  });
});
