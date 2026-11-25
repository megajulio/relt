import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
/**
 * T57-18 (Orden #57 · Bloque 3 · ANEXO-57-G) — pestaña Skills del detalle del agente.
 * Criterio: el binding ofrece también las skills de la org.
 * Orden #64 · ANEXO-64-E (E-2, V8): desde la #64 las skills de org SÍ se pueden fijar a
 * una versión publicada; la opción pasa a «Automática (última versión)» / «Fijar
 * versión», con las versiones de `GET …/versions` (antes decía «no se fijan a una
 * versión»). Ajuste de clase A de A-7.
 */

const SKILLS = [
  { name: 'general', latest_version: '1.0.0', description: 'General', tools_count: 1, permissions: ['products:read'], triggers: [], kind: 'repo', tools: ['products.search'] },
  { name: 'mi-tienda', latest_version: '1', description: 'De la org', tools_count: 1, permissions: ['products:read'], triggers: [], kind: 'org', display_name: 'Mi Tienda', base_skill: 'general', allowed_tools: ['products.search'], tools: ['products.search'], status: 'active', current_version: '1.0.0', has_unpublished_changes: false, published_tools: ['products.search'] },
];

vi.mock('@/lib/agents', () => ({
  getAgent: vi.fn(),
  patchAgentConfig: vi.fn(async () => undefined),
  listSkills: vi.fn(async () => SKILLS),
}));
vi.mock('@/lib/skills', () => ({
  listSkills: vi.fn(async () => SKILLS),
  listSkillsWithTools: vi.fn(async () => SKILLS),
  listSkillVersions: vi.fn(async () => ({
    versions: [
      { version: '1.0.0', bump: 'initial', display_name: 'Mi Tienda', description: '', instructions: '', allowed_tools: ['products.search'], base_skill: 'general', changelog: null, published_at: '2026-01-01T00:00:00Z', published_by: null },
    ],
    total: 1,
  })),
  getSkill: vi.fn(),
  createOrgSkill: vi.fn(),
  patchOrgSkill: vi.fn(),
  getPublishPreview: vi.fn(),
  publishOrgSkill: vi.fn(),
}));

import AgentSkillsForm from '@/components/agent-skills-form';
import { renderWithI18n } from './render-with-i18n';

const render = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, 'es');

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

  it('muestra el origen y, para una skill de la org, Automática o Fijar versión', async () => {
    render(<AgentSkillsForm agent={AGENT} onSaved={() => {}} />);

    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /De tu organización/ })).not.toBeNull();
    });

    const option = screen.getByRole('option', { name: /De tu organización/ });
    const select = option.closest('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'mi-tienda' } });

    await waitFor(() =>
      expect(screen.queryByText('Automática (última versión)')).not.toBeNull(),
    );
    expect(screen.queryByText('Fijar versión')).not.toBeNull();
  });
});
