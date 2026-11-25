import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';

/**
 * T64-13 (Orden #64 · ANEXO-64-F · F-3) — fijar una versión (pestaña Skills del agente).
 * Automática manda `{ skill }`; fijada manda la versión; una fijada que no es la última sale
 * elegida (A-8); cambiar de skill vuelve a Automática; versión no disponible;
 * `skill_version_not_found`; M4 (con «Fijar versión» y sin versión no se guarda; y al llegar
 * las versiones tarde se elige la más nueva EN EL ESTADO); M5 (al cargar y al fallar no se
 * dice «no disponible» y el error se muestra); cambiar de una skill de org a otra; y una de
 * RELT, fijada y automática, como hoy.
 */

const GENERAL = {
  name: 'general', latest_version: '1.0.0', description: 'General', tools_count: 1,
  permissions: ['products:read'], triggers: [], kind: 'repo' as const, tools: ['products.search'],
};
const TIENDA = {
  name: 'tienda', latest_version: '3', description: 'Tienda', tools_count: 1,
  permissions: ['products:read'], triggers: [], kind: 'org' as const, display_name: 'Tienda',
  base_skill: 'general', allowed_tools: ['products.search'], tools: ['products.search'],
  status: 'active' as const, current_version: '2.0.0', has_unpublished_changes: false,
  published_tools: ['products.search'],
};
const OTRA = {
  ...TIENDA, name: 'otra', display_name: 'Otra', current_version: '9.0.0',
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
// Se conservan los helpers reales (selectableSkills, selectorTools) y se sustituyen solo
// las llamadas a la API.
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

const skillSelect = () => screen.getAllByRole('combobox')[0] as HTMLSelectElement;
const versionSelect = () => screen.getByLabelText('Versión de la skill') as HTMLSelectElement;
const saveButton = () => screen.getByRole('button', { name: 'Guardar cambios' }) as HTMLButtonElement;
const versionOptionValues = () => Array.from(versionSelect().options).map((o) => o.value);

function renderForm(binding: { skill: string; version?: string } | undefined) {
  const ag = agent(binding);
  mocks.getAgent.mockResolvedValue(ag);
  renderWithI18n(<AgentSkillsForm agent={ag} onSaved={() => {}} />, 'es');
}

async function renderOrgForm(binding: { skill: string; version?: string } | undefined) {
  renderForm(binding);
  await waitFor(() => expect(screen.queryAllByRole('option', { name: /tienda/ }).length).toBeGreaterThan(0));
  await waitFor(() => expect(versionOptionValues()).toContain('2.0.0'));
}

describe('T64-13 · fijar una versión', () => {
  beforeEach(() => {
    mocks.listSkills.mockResolvedValue([GENERAL, TIENDA, OTRA]);
    mocks.listSkillVersions.mockResolvedValue({
      versions: [
        { version: '2.0.0', bump: 'major', display_name: 'T', description: '', instructions: '', allowed_tools: ['products.search'], base_skill: 'general', changelog: null, published_at: '2026-02-01T00:00:00Z', published_by: null },
        { version: '1.0.0', bump: 'initial', display_name: 'T', description: '', instructions: '', allowed_tools: ['products.search'], base_skill: 'general', changelog: null, published_at: '2026-01-01T00:00:00Z', published_by: null },
      ],
      total: 2,
    });
    mocks.getAgent.mockResolvedValue(agent({ skill: 'tienda' }));
    mocks.patchAgentConfig.mockResolvedValue(undefined);
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('Automática manda `{ skill }`, sin version', async () => {
    await renderOrgForm({ skill: 'tienda', version: '1.0.0' });
    fireEvent.click(screen.getByRole('radio', { name: /Automática/ }));
    fireEvent.click(saveButton());
    await waitFor(() => expect(mocks.patchAgentConfig).toHaveBeenCalled());
    expect(mocks.patchAgentConfig.mock.calls[0][0]).toBe('a1');
    expect(mocks.patchAgentConfig.mock.calls[0][1]).toEqual({ skillBinding: { skill: 'tienda' } });
  });

  it('fijada manda `{ skill, version }`', async () => {
    await renderOrgForm({ skill: 'tienda' });
    fireEvent.click(screen.getByRole('radio', { name: /Fijar versión/ }));
    fireEvent.click(saveButton());
    await waitFor(() => expect(mocks.patchAgentConfig).toHaveBeenCalled());
    expect(mocks.patchAgentConfig.mock.calls[0][1]).toEqual({
      skillBinding: { skill: 'tienda', version: '2.0.0' },
    });
  });

  it('una versión fijada que no es la última sale elegida (A-8)', async () => {
    await renderOrgForm({ skill: 'tienda', version: '1.0.0' });
    expect(versionSelect().value).toBe('1.0.0');
    expect(versionOptionValues()).toEqual(['2.0.0', '1.0.0']);
  });

  it('al cambiar de skill vuelve a Automática', async () => {
    await renderOrgForm({ skill: 'tienda', version: '1.0.0' });
    expect((screen.getByRole('radio', { name: /Automática/ }) as HTMLInputElement).checked).toBe(false);
    fireEvent.change(skillSelect(), { target: { value: 'general' } });
    expect((screen.getByRole('radio', { name: /Automática/ }) as HTMLInputElement).checked).toBe(true);
  });

  it('una versión fijada que ya no está se muestra como no disponible y se conserva', async () => {
    await renderOrgForm({ skill: 'tienda', version: '0.9.0' });
    expect(versionSelect().value).toBe('0.9.0');
    expect(Array.from(versionSelect().options).some((o) => /Versión no disponible/.test(o.textContent ?? ''))).toBe(true);
  });

  it('skill_version_not_found se muestra en lenguaje claro', async () => {
    mocks.patchAgentConfig.mockRejectedValueOnce(
      Object.assign(new Error('no ver'), { status: 400, code: 'skill_version_not_found' }),
    );
    await renderOrgForm({ skill: 'tienda' });
    fireEvent.click(screen.getByRole('radio', { name: /Fijar versión/ }));
    fireEvent.click(saveButton());
    await waitFor(() => expect(screen.queryByText('Esa versión no existe para esa skill.')).not.toBeNull());
  });

  it('guardar no reemplaza una skill que ya no está en el catálogo', async () => {
    renderForm({ skill: 'vieja', version: '0.9.0' });
    await waitFor(() => expect(screen.queryByRole('radio', { name: /Fijar versión/ })).not.toBeNull());
    // Pasar a Automática: la skill se conserva, la versión se quita.
    fireEvent.click(screen.getByRole('radio', { name: /Automática/ }));
    fireEvent.click(saveButton());
    await waitFor(() => expect(mocks.patchAgentConfig).toHaveBeenCalled());
    expect(mocks.patchAgentConfig.mock.calls[0][1]).toEqual({ skillBinding: { skill: 'vieja' } });
  });


  it('M4: con «Fijar versión» y sin versión elegida, NO se guarda y se explica', async () => {
    mocks.listSkillVersions.mockImplementation(() => new Promise(() => {}));
    renderForm({ skill: 'tienda' });
    await waitFor(() => expect(screen.queryAllByRole('option', { name: /tienda/ }).length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('radio', { name: /Fijar versión/ }));
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(screen.queryByText('Elige una versión para fijarla, o usa Automática.')).not.toBeNull(),
    );
    expect(mocks.patchAgentConfig).not.toHaveBeenCalled();
  });

  it('M4: si las versiones llegan tarde, al fijar se elige la más nueva EN EL ESTADO', async () => {
    let resolveVersions!: (v: unknown) => void;
    mocks.listSkillVersions.mockImplementationOnce(
      () => new Promise((res) => { resolveVersions = res; }),
    );
    renderForm({ skill: 'tienda' });
    await waitFor(() => expect(screen.queryAllByRole('option', { name: /tienda/ }).length).toBeGreaterThan(0));
    await waitFor(() => expect(mocks.listSkillVersions).toHaveBeenCalled());
    // El usuario elige fijar ANTES de que lleguen las versiones.
    fireEvent.click(screen.getByRole('radio', { name: /Fijar versión/ }));
    resolveVersions({
      versions: [
        { version: '3.1.0', bump: 'minor', display_name: 'T', description: '', instructions: '', allowed_tools: ['products.search'], base_skill: 'general', changelog: null, published_at: '2026-03-01T00:00:00Z', published_by: null },
        { version: '2.0.0', bump: 'major', display_name: 'T', description: '', instructions: '', allowed_tools: ['products.search'], base_skill: 'general', changelog: null, published_at: '2026-02-01T00:00:00Z', published_by: null },
      ],
      total: 2,
    });
    await waitFor(() => expect(versionSelect().value).toBe('3.1.0'));
    fireEvent.click(saveButton());
    await waitFor(() => expect(mocks.patchAgentConfig).toHaveBeenCalled());
    expect(mocks.patchAgentConfig.mock.calls[0][1]).toEqual({
      skillBinding: { skill: 'tienda', version: '3.1.0' },
    });
  });

  it('M5: mientras cargan las versiones, NO dice «Versión no disponible»', async () => {
    mocks.listSkillVersions.mockImplementation(() => new Promise(() => {}));
    renderForm({ skill: 'tienda', version: '0.9.0' });
    await waitFor(() => expect(screen.queryAllByRole('option', { name: /tienda/ }).length).toBeGreaterThan(0));
    await waitFor(() => expect(screen.queryByText('Cargando versiones...')).not.toBeNull());
    expect(
      Array.from(versionSelect().options).some((o) => /Versión no disponible/.test(o.textContent ?? '')),
    ).toBe(false);
  });

  it('M5: si fallan las versiones, se muestra el error y NO dice «Versión no disponible»', async () => {
    mocks.listSkillVersions.mockRejectedValueOnce(Object.assign(new Error('boom'), { status: 500 }));
    renderForm({ skill: 'tienda', version: '0.9.0' });
    await waitFor(() => expect(screen.queryAllByRole('option', { name: /tienda/ }).length).toBeGreaterThan(0));
    await waitFor(() => expect(screen.queryByText('No se pudo guardar. Intenta de nuevo.')).not.toBeNull());
    expect(
      Array.from(versionSelect().options).some((o) => /Versión no disponible/.test(o.textContent ?? '')),
    ).toBe(false);
  });

  it('cambiar de una skill de org a otra de org recarga las versiones y vuelve a Automática', async () => {
    await renderOrgForm({ skill: 'tienda', version: '1.0.0' });
    mocks.listSkillVersions.mockResolvedValueOnce({
      versions: [
        { version: '9.0.0', bump: 'major', display_name: 'O', description: '', instructions: '', allowed_tools: ['products.search'], base_skill: 'general', changelog: null, published_at: '2026-04-01T00:00:00Z', published_by: null },
      ],
      total: 1,
    });
    fireEvent.change(skillSelect(), { target: { value: 'otra' } });
    await waitFor(() => expect(versionOptionValues()).toContain('9.0.0'));
    expect((screen.getByRole('radio', { name: /Automática/ }) as HTMLInputElement).checked).toBe(true);
  });

  it('una skill de RELT fijada manda `{ skill, version }`', async () => {
    renderForm({ skill: 'general' });
    await waitFor(() => expect(screen.queryAllByRole('option', { name: /general/ }).length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('radio', { name: /Fijar versión/ }));
    fireEvent.click(saveButton());
    await waitFor(() => expect(mocks.patchAgentConfig).toHaveBeenCalled());
    expect(mocks.patchAgentConfig.mock.calls[0][1]).toEqual({
      skillBinding: { skill: 'general', version: '1.0.0' },
    });
  });

  it('una skill de RELT en Automática manda `{ skill }`', async () => {
    renderForm({ skill: 'general', version: '1.0.0' });
    await waitFor(() => expect(screen.queryAllByRole('option', { name: /general/ }).length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('radio', { name: /Automática/ }));
    fireEvent.click(saveButton());
    await waitFor(() => expect(mocks.patchAgentConfig).toHaveBeenCalled());
    expect(mocks.patchAgentConfig.mock.calls[0][1]).toEqual({ skillBinding: { skill: 'general' } });
  });
});

