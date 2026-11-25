import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';

/**
 * T64-14 (Orden #64 · ANEXO-64-E · E-3) — los dos selectores (alta y pestaña Skills).
 * Solo las de RELT y las de org `active`; muestran `published_tools` y no las de la
 * copia de trabajo; la skill actual no disponible se conserva.
 */

const REPO = {
  name: 'general', latest_version: '1.0.0', description: 'General', tools_count: 1,
  permissions: ['products:read'], triggers: [], kind: 'repo', tools: ['products.search'],
};
const ACTIVA = {
  name: 'activa', latest_version: '3', description: 'Activa', tools_count: 2,
  permissions: ['products:read'], triggers: [], kind: 'org', display_name: 'Activa',
  base_skill: 'general', allowed_tools: ['products.search', 'quotes.create'],
  tools: ['products.search', 'quotes.create'], status: 'active', current_version: '1.0.0',
  has_unpublished_changes: true, published_tools: ['products.search'],
};
const BORRADOR = {
  name: 'borrador', latest_version: '1', description: 'Borrador', tools_count: 1,
  permissions: ['products:read'], triggers: [], kind: 'org', display_name: 'Borrador',
  base_skill: 'general', allowed_tools: ['products.search'], tools: ['products.search'],
  status: 'draft', current_version: null, has_unpublished_changes: true, published_tools: null,
};
const ARCHIVADA = {
  name: 'archivada', latest_version: '9', description: 'Archivada', tools_count: 1,
  permissions: ['products:read'], triggers: [], kind: 'org', display_name: 'Archivada',
  base_skill: 'general', allowed_tools: ['products.search'], tools: ['products.search'],
  status: 'archived', current_version: '1.0.0', has_unpublished_changes: false,
  published_tools: ['products.search'],
};

const mocks = vi.hoisted(() => ({ listSkills: vi.fn(), listSkillVersions: vi.fn(), getAgent: vi.fn() }));

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({ useDashboardAuth: () => ({}) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('next/link', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/lib/agents', () => ({ createAgent: vi.fn(), getAgent: mocks.getAgent, patchAgentConfig: vi.fn() }));
vi.mock('@/lib/models', () => ({ listModels: vi.fn(async () => []) }));
vi.mock('@/lib/skills', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/skills')>();
  return {
    ...actual,
    listSkills: mocks.listSkills,
    listSkillsWithTools: mocks.listSkills,
    listSkillVersions: mocks.listSkillVersions,
    getSkill: vi.fn(),
    createOrgSkill: vi.fn(),
    patchOrgSkill: vi.fn(),
    getPublishPreview: vi.fn(),
    publishOrgSkill: vi.fn(),
  };
});

import CreateAgentPage from '@/app/dashboard/agents/new/page';
import AgentSkillsForm from '@/components/agent-skills-form';
import { renderWithI18n } from './render-with-i18n';

const CATALOG = [REPO, ACTIVA, BORRADOR, ARCHIVADA];

async function renderAlta() {
  renderWithI18n(<CreateAgentPage />, 'es');
  await waitFor(() => {
    const select = screen.queryByRole('combobox', { name: 'Skill por defecto' }) as HTMLSelectElement | null;
    expect(select).not.toBeNull();
    expect(Array.from(select!.options).map((o) => o.value)).toContain('activa');
  });
  return screen.getByRole('combobox', { name: 'Skill por defecto' }) as HTMLSelectElement;
}

async function renderTab(skill: string) {
  const ag = {
    id: 'a1', organizationId: 'o1', key: 'k', name: 'A', status: 'active' as const,
    defaultSkill: skill, config: {}, createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z', bindings: [],
  };
  mocks.getAgent.mockResolvedValue(ag);
  renderWithI18n(<AgentSkillsForm agent={ag} onSaved={() => {}} />, 'es');
  await waitFor(() =>
    expect(
      Array.from((screen.getAllByRole('combobox')[0] as HTMLSelectElement).options).map((o) => o.value),
    ).toContain('activa'),
  );
  return screen.getAllByRole('combobox')[0] as HTMLSelectElement;
}

describe('T64-14 · los dos selectores', () => {
  beforeEach(() => {
    mocks.listSkills.mockResolvedValue(CATALOG);
    mocks.listSkillVersions.mockResolvedValue({ versions: [], total: 0 });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('el selector del alta no ofrece draft ni archived', async () => {
    const select = await renderAlta();
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toContain('general');
    expect(values).toContain('activa');
    expect(values).not.toContain('borrador');
    expect(values).not.toContain('archivada');
  });

  it('el selector de la pestaña tampoco ofrece draft ni archived', async () => {
    const select = await renderTab('general');
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toContain('activa');
    expect(values).not.toContain('borrador');
    expect(values).not.toContain('archivada');
  });

  it('muestra las capacidades publicadas, no las de la copia de trabajo', async () => {
    const select = await renderAlta();
    const option = Array.from(select.options).find((o) => o.value === 'activa')!;
    expect(option.textContent).toContain('Consulta productos');
    expect(option.textContent).not.toContain('Crea cotizaciones');
  });

  it('la skill actual que ya no está se conserva, marcada como no disponible', async () => {
    const select = await renderTab('vieja');
    const option = Array.from(select.options).find((o) => o.value === 'vieja');
    expect(option).not.toBeUndefined();
    expect(option!.textContent).toContain('Skill no disponible');
  });
});
