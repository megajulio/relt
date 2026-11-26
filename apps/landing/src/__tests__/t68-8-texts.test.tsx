import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';

/**
 * ORDEN-68 · Bloque 2 · T68-8 · ANEXO-68-A · A-6.
 *
 * El aviso va en los DOS idiomas con la clave nueva `agents.read_only_role`
 * (guardián T62-4): «Tu rol permite ver los agentes, no modificarlos.» /
 * «Your role can view agents, not change them.»
 */

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({
    data: {
      user: { id: 'u-1', email: 'u@example.invalid', name: 'User' },
      organizations: [{ id: 'org-1', name: 'Org', role: 'viewer' }],
    },
    logout: async () => {},
  }),
}));

vi.mock('@/lib/agents', () => ({
  getAgent: vi.fn(),
  patchAgentConfig: vi.fn(),
}));

vi.mock('@/lib/models', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/models')>();
  return { ...actual, listModels: vi.fn(async () => []) };
});

import esJson from '@/i18n/messages/es.json';
import enJson from '@/i18n/messages/en.json';
import AgentConfigForm from '@/components/agent-config-form';
import { renderWithI18n } from './render-with-i18n';

const agent = {
  id: 'agent-1',
  key: 'agent-uno',
  name: 'Agente Uno',
  status: 'active',
  defaultSkill: 'general',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  config: {
    maxSteps: 3,
    tone: 'neutral',
    systemPrompt: '',
    memory: { shortTerm: { enabled: true, limit: 10 }, summary: { enabled: false } },
    skillBinding: { skill: 'general' },
    toolBindings: [],
  },
  bindings: [],
} as never;

describe('T68-8 · el aviso en es y en', () => {
  afterEach(() => cleanup());

  it('la clave existe en los dos catálogos con el texto exacto', () => {
    expect((esJson as Record<string, string>)['agents.read_only_role']).toBe(
      'Tu rol permite ver los agentes, no modificarlos.',
    );
    expect((enJson as Record<string, string>)['agents.read_only_role']).toBe(
      'Your role can view agents, not change them.',
    );
  });

  it('se pinta en español', () => {
    renderWithI18n(<AgentConfigForm agent={agent} onSaved={vi.fn()} />, 'es');
    expect(
      screen.queryByText('Tu rol permite ver los agentes, no modificarlos.'),
    ).not.toBeNull();
  });

  it('se pinta en inglés', () => {
    renderWithI18n(<AgentConfigForm agent={agent} onSaved={vi.fn()} />, 'en');
    expect(screen.queryByText('Your role can view agents, not change them.')).not.toBeNull();
  });
});
