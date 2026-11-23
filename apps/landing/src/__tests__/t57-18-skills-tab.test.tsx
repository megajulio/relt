import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * T57-18 (Orden #57 · Bloque 3 · ANEXO-57-G) — pestaña Skills del detalle del agente.
 * Criterio: el binding ofrece también las skills de la org; y, por A-7, no se les ofrece
 * fijar versión (un `skillBinding` con `version` sobre una skill de org da 400).
 */

const SKILLS = [
  { name: 'general', latest_version: '1.0.0', description: 'General', tools_count: 1, permissions: ['products:read'], triggers: [], kind: 'repo', tools: ['products.search'] },
  { name: 'mi-tienda', latest_version: '1', description: 'De la org', tools_count: 1, permissions: ['products:read'], triggers: [], kind: 'org', display_name: 'Mi Tienda', base_skill: 'general', allowed_tools: ['products.search'], tools: ['products.search'] },
];

vi.mock('@/lib/agents', () => ({
  getAgent: vi.fn(),
  patchAgentConfig: vi.fn(async () => undefined),
  listSkills: vi.fn(async () => SKILLS),
}));
vi.mock('@/lib/skills', () => ({
  listSkills: vi.fn(async () => SKILLS),
  listSkillsWithTools: vi.fn(async () => SKILLS),
  getSkill: vi.fn(),
  createOrgSkill: vi.fn(),
  patchOrgSkill: vi.fn(),
}));

import AgentSkillsForm from '@/components/agent-skills-form';

const AGENT = {
  id: 'a1',
  organizationId: 'o1',
  key: 'k',
  name: 'A',
  status: 'active' as const,
  defaultSkill: 'general',
  config: {},
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  bindings: [],
};

describe('T57-18 · pestaña Skills: el binding ofrece las skills de la org', () => {
  afterEach(() => cleanup());

  it('muestra el origen y no ofrece fijar versión para una skill de la org', async () => {
    render(<AgentSkillsForm agent={AGENT} onSaved={() => {}} />);

    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /De tu organización/ })).not.toBeNull();
    });

    const option = screen.getByRole('option', { name: /De tu organización/ });
    const select = option.closest('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'mi-tienda' } });

    expect(screen.queryByText(/no se fijan a una versión/)).not.toBeNull();
  });
});
