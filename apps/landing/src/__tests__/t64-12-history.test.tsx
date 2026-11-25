import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';

/**
 * T64-12 (Orden #64 · ANEXO-64-E · E-3) — el historial.
 * El orden `1.10.0` > `1.9.0` tal como lo da la API; la vigente; `changelog` nulo; sin
 * versiones; `published_by` no aparece.
 */

const TIENDA = {
  name: 'tienda', latest_version: '3', description: 'Tienda', tools_count: 1,
  permissions: ['products:read'], triggers: [], kind: 'org', display_name: 'Tienda',
  base_skill: 'general', allowed_tools: ['products.search'], tools: ['products.search'],
  status: 'archived', current_version: '1.10.0', has_unpublished_changes: false,
  published_tools: ['products.search'],
};

function version(over: Record<string, unknown>) {
  return {
    bump: 'minor', display_name: 'Tienda', description: 'Tienda', instructions: '',
    allowed_tools: ['products.search'], base_skill: 'general', changelog: 'notas',
    published_at: '2026-01-02T00:00:00Z', published_by: 'u-secret',
    ...over,
  };
}

// Orden de la API: de la más nueva a la más vieja, semver (1.10.0 > 1.9.0).
const VERSIONS = [
  version({ version: '1.10.0', published_at: '2026-02-01T00:00:00Z', changelog: 'notas nuevas' }),
  version({ version: '1.9.0', published_at: '2026-01-01T00:00:00Z', changelog: null }),
];

const mocks = vi.hoisted(() => ({
  listSkillsWithTools: vi.fn(),
  createOrgSkill: vi.fn(),
  patchOrgSkill: vi.fn(),
  getPublishPreview: vi.fn(),
  publishOrgSkill: vi.fn(),
  listSkillVersions: vi.fn(),
}));

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({ useDashboardAuth: () => ({}) }));
vi.mock('@/lib/skills', () => ({
  listSkillsWithTools: mocks.listSkillsWithTools,
  listSkills: mocks.listSkillsWithTools,
  getSkill: vi.fn(),
  createOrgSkill: mocks.createOrgSkill,
  patchOrgSkill: mocks.patchOrgSkill,
  getPublishPreview: mocks.getPublishPreview,
  publishOrgSkill: mocks.publishOrgSkill,
  listSkillVersions: mocks.listSkillVersions,
}));

import SkillsPage from '@/app/dashboard/skills/page';
import { renderWithI18n } from './render-with-i18n';

function historyRows(): HTMLElement[] {
  return Array.from(document.querySelectorAll('[data-testid="history-row"]')) as HTMLElement[];
}

async function openHistory() {
  renderWithI18n(<SkillsPage />, 'es');
  await waitFor(() => expect(screen.queryAllByText('Historial').length).toBeGreaterThan(0));
  fireEvent.click(screen.getAllByText('Historial')[0]);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeNull());
  return screen.getByRole('dialog');
}

describe('T64-12 · historial', () => {
  beforeEach(() => {
    mocks.listSkillsWithTools.mockResolvedValue([TIENDA]);
    mocks.patchOrgSkill.mockResolvedValue({});
    mocks.createOrgSkill.mockResolvedValue({});
    mocks.getPublishPreview.mockResolvedValue({ next_version: '2.0.0', bump: 'major', added_tools: [], removed_tools: [], agents_on_latest: 0 });
    mocks.publishOrgSkill.mockResolvedValue({});
    mocks.listSkillVersions.mockResolvedValue({ versions: VERSIONS, total: VERSIONS.length });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('respeta el orden de la API: 1.10.0 antes que 1.9.0', async () => {
    const dialog = await openHistory();
    await waitFor(() => expect(historyRows().length).toBe(2));
    expect(historyRows().map((el) => el.getAttribute('data-version'))).toEqual(['1.10.0', '1.9.0']);
    expect(within(dialog).getAllByText(/^v1\.10\.0$/).length).toBeGreaterThan(0);
  });

  it('marca la versión vigente', async () => {
    const dialog = await openHistory();
    await waitFor(() => expect(historyRows().length).toBe(2));
    const current = dialog.querySelector('[data-version="1.10.0"]') as HTMLElement;
    const older = dialog.querySelector('[data-version="1.9.0"]') as HTMLElement;
    expect(within(current).queryByText('Vigente')).not.toBeNull();
    expect(within(older).queryByText('Vigente')).toBeNull();
  });

  it('un changelog nulo no rompe la vista', async () => {
    const dialog = await openHistory();
    await waitFor(() => expect(historyRows().length).toBe(2));
    const older = dialog.querySelector('[data-version="1.9.0"]') as HTMLElement;
    expect(within(older).queryByText(/null/)).toBeNull();
    expect(within(older).getByText(/—/)).not.toBeNull();
  });

  it('sin versiones muestra un estado vacío', async () => {
    mocks.listSkillVersions.mockResolvedValue({ versions: [], total: 0 });
    await openHistory();
    await waitFor(() =>
      expect(screen.queryByText('Esta skill todavía no tiene versiones.')).not.toBeNull(),
    );
  });

  it('no muestra published_by', async () => {
    await openHistory();
    await waitFor(() => expect(historyRows().length).toBe(2));
    expect(screen.queryByText('u-secret')).toBeNull();
  });

  it('muestra el tipo, la fecha y las tools de cada versión', async () => {
    const dialog = await openHistory();
    await waitFor(() => expect(historyRows().length).toBe(2));
    const older = dialog.querySelector('[data-version="1.9.0"]') as HTMLElement;
    expect(within(older).queryByText('Menor (agrega capacidades)')).not.toBeNull();
    expect(within(older).queryByText(/2026-01-01T00:00:00Z/)).not.toBeNull();
    expect(within(older).queryByText(/products\.search/)).not.toBeNull();
  });
});
