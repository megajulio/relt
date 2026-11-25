import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';

/**
 * T64-13 (Orden #64 · ANEXO-64-E · E-3) — fijar una versión (pestaña Skills del agente).
 * Automática manda `{ skill }`; fijada manda la versión; una fijada que no es la última
 * sale elegida (A-8); cambiar de skill vuelve a Automática; versión no disponible;
 * `skill_version_not_found`.
 */

const GENERAL = {
  name: 'general', latest_version: '1.0.0', description: 'General', tools_count: 1,
  permissions: ['products:read'], triggers: [], kind: 'repo', tools: ['products.search'],
};
const TIENDA = {
  name: 'tienda', latest_version: '3', description: 'Tienda', tools_count: 1,
  permissions: ['products:read'], triggers: [], kind: 'org', display_name: 'Tienda',
  base_skill: 'general', allowed_tools: ['products.search'], tools: ['products.search'],
  status: 'active', current_version: '2.0.0', has_unpublished_changes: false,
  published_tools: ['products.search'],
};

const mocks = vi.hoisted(() => ({
  listSkills: vi.fn(),
  listSkillVersions: vi.fn(),
  getAgent: vi.fn(),
  patchAgentConfig: vi.fn(),
}));

vi.mock('@/lib/agents', () => ({
  getAgent: mocks.getAgent,
  patchAgentConfig: mocks.patchAgentConfig,
}));
// Se conservan los helpers reales (selectableSkills, selectorTools) y se sustituyen
// solo las llamadas a la API.
vi.mock('@/lib/skills', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/skills')>();
  return {
    ...actual,
    listSkills: mocks.listSkills,
    listSkillVersions: mocks.listSkillVersions,
    listSkillsWithTools: vi.fn(),
    getSkill: vi.fn(),
    createOrgSkill: vi.fn(),
    patchOrgSkill: vi.fn(),
    getPublishPreview: vi.fn(),
    publishOrgSkill: vi.fn(),
  };
});

import AgentSkillsForm from '@/components/agent-skills-form';
import { renderWithI18n } from './render-with-i18n';

function agent(binding: { skill: string; version?: string } | undefined) {
  return {
    id: 'a1', organizationId: 'o1', key: 'k', name: 'A', status: 'active' as const,
    defaultSkill: 'general', config: binding ? { skillBinding: binding } : {},
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', bindings: [],
  };
}

async function renderForm(binding: { skill: string; version?: string } | undefined) {
  const ag = agent(binding);
  mocks.getAgent.mockResolvedValue(ag);
  renderWithI18n(<AgentSkillsForm agent={ag} onSaved={() => {}} />, 'es');
  await waitFor(() => expect(screen.queryAllByRole('option', { name: /tienda/ }).length).toBeGreaterThan(0));
  // Las versiones de la skill de org llegan de `GET …/versions` en un segundo paso.
  await waitFor(() =>
    expect(Array.from(versionSelect().options).map((o) => o.value)).toContain('2.0.0'),
  );
}

const skillSelect = () => screen.getAllByRole('combobox')[0] as HTMLSelectElement;
const versionSelect = () => screen.getByLabelText('Versión de la skill') as HTMLSelectElement;
const saveButton = () => screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement;

describe('T64-13 · fijar una versión', () => {
  beforeEach(() => {
    mocks.listSkills.mockResolvedValue([GENERAL, TIENDA]);
    mocks.listSkillVersions.mockResolvedValue({ versions: [
      { version: '2.0.0', bump: 'major', display_name: 'T', description: '', instructions: '', allowed_tools: ['products.search'], base_skill: 'general', changelog: null, published_at: '2026-02-01T00:00:00Z', published_by: null },
      { version: '1.0.0', bump: 'initial', display_name: 'T', description: '', instructions: '', allowed_tools: ['products.search'], base_skill: 'general', changelog: null, published_at: '2026-01-01T00:00:00Z', published_by: null },
    ], total: 2 });
    mocks.getAgent.mockResolvedValue(agent({ skill: 'tienda' }));
    mocks.patchAgentConfig.mockResolvedValue(undefined);
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('Automática manda `{ skill }`, sin version', async () => {
    await renderForm({ skill: 'tienda', version: '1.0.0' });
    fireEvent.click(screen.getByRole('radio', { name: /Automática/ }));
    fireEvent.click(saveButton());
    await waitFor(() => expect(mocks.patchAgentConfig).toHaveBeenCalled());
    expect(mocks.patchAgentConfig.mock.calls[0][0]).toBe('a1');
    expect(mocks.patchAgentConfig.mock.calls[0][1]).toEqual({ skillBinding: { skill: 'tienda' } });
  });

  it('fijada manda `{ skill, version }`', async () => {
    await renderForm({ skill: 'tienda' });
    fireEvent.click(screen.getByRole('radio', { name: /Fijar versión/ }));
    fireEvent.click(saveButton());
    await waitFor(() => expect(mocks.patchAgentConfig).toHaveBeenCalled());
    expect(mocks.patchAgentConfig.mock.calls[0][1]).toEqual({
      skillBinding: { skill: 'tienda', version: '2.0.0' },
    });
  });

  it('una versión fijada que no es la última sale elegida (A-8)', async () => {
    await renderForm({ skill: 'tienda', version: '1.0.0' });
    expect(versionSelect().value).toBe('1.0.0');
    expect(Array.from(versionSelect().options).map((o) => o.value)).toEqual(['2.0.0', '1.0.0']);
  });

  it('al cambiar de skill vuelve a Automática', async () => {
    await renderForm({ skill: 'tienda', version: '1.0.0' });
    expect((screen.getByRole('radio', { name: /Automática/ }) as HTMLInputElement).checked).toBe(false);
    fireEvent.change(skillSelect(), { target: { value: 'general' } });
    expect((screen.getByRole('radio', { name: /Automática/ }) as HTMLInputElement).checked).toBe(true);
  });

  it('una versión fijada que ya no está se muestra como no disponible y se conserva', async () => {
    await renderForm({ skill: 'tienda', version: '0.9.0' });
    expect(versionSelect().value).toBe('0.9.0');
    expect(Array.from(versionSelect().options).some((o) => /Versión no disponible/.test(o.textContent ?? ''))).toBe(true);
  });

  it('skill_version_not_found se muestra en lenguaje claro', async () => {
    mocks.patchAgentConfig.mockRejectedValueOnce(
      Object.assign(new Error('no ver'), { status: 400, code: 'skill_version_not_found' }),
    );
    await renderForm({ skill: 'tienda' });
    fireEvent.click(screen.getByRole('radio', { name: /Fijar versión/ }));
    fireEvent.click(saveButton());
    await waitFor(() => expect(screen.queryByText('Esa versión no existe para esa skill.')).not.toBeNull());
  });
});
