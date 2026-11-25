import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';

/**
 * T64-12 (Orden #64 · ANEXO-64-F · F-3) — el historial.
 * El orden `1.10.0` > `1.9.0` tal como lo da la API; la vigente; `changelog` nulo; sin
 * versiones; `published_by` no aparece; la fecha en el formato del idioma activo (`es` y
 * `en`, M10); las frases de las tools (M10); con error, sin texto de vacío (M12); y una
 * respuesta atrasada de otra skill se descarta (M6).
 */

const mocks = vi.hoisted(() => ({
  listSkillsWithTools: vi.fn(),
  createOrgSkill: vi.fn(),
  patchOrgSkill: vi.fn(),
  getSkill: vi.fn(),
  getPublishPreview: vi.fn(),
  publishOrgSkill: vi.fn(),
  listSkillVersions: vi.fn(),
}));

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({ useDashboardAuth: () => ({}) }));
vi.mock('@/lib/skills', () => ({
  listSkillsWithTools: mocks.listSkillsWithTools,
  listSkills: mocks.listSkillsWithTools,
  getSkill: mocks.getSkill,
  createOrgSkill: mocks.createOrgSkill,
  patchOrgSkill: mocks.patchOrgSkill,
  getPublishPreview: mocks.getPublishPreview,
  publishOrgSkill: mocks.publishOrgSkill,
  listSkillVersions: mocks.listSkillVersions,
}));

import SkillsPage from '@/app/dashboard/skills/page';
import { orgSkill, publishPreview, repoSkill, skillDetail, versionRecord } from './t64-fixtures';
import { renderWithI18n } from './render-with-i18n';
import type { Locale } from '@/i18n/types';

function row(name: string): HTMLElement {
  const el = document.querySelector(`[data-testid="skill-row"][data-name="${name}"]`);
  if (!el) throw new Error(`fila no encontrada: ${name}`);
  return el as HTMLElement;
}

function historyRows(): HTMLElement[] {
  return Array.from(document.querySelectorAll('[data-testid="history-row"]')) as HTMLElement[];
}

// Orden de la API: de la más nueva a la más vieja, semver (1.10.0 > 1.9.0).
const VERSIONS = [
  versionRecord({ version: '1.10.0', published_at: '2026-02-01T00:00:00Z', changelog: 'notas nuevas', allowed_tools: ['quotes.create'] }),
  versionRecord({ version: '1.9.0', published_at: '2026-01-01T00:00:00Z', changelog: null, allowed_tools: ['products.search'] }),
];

const SKILLS = [
  repoSkill(),
  orgSkill({ name: 'tienda', display_name: 'Tienda', status: 'archived', current_version: '1.10.0' }),
  orgSkill({ name: 'otra', display_name: 'Otra', status: 'archived', current_version: '1.0.0' }),
];

async function openHistory(name = 'tienda', locale: Locale = 'es') {
  renderWithI18n(<SkillsPage />, locale);
  await waitFor(() => expect(screen.queryAllByTestId('skill-row').length).toBe(SKILLS.length));
  fireEvent.click(within(row(name)).getByText(locale === 'en' ? 'History' : 'Historial'));
  const dialog = await screen.findByRole('dialog');
  await waitFor(() => expect(historyRows().length).toBeGreaterThan(0));
  return dialog;
}

describe('T64-12 · historial', () => {
  beforeEach(() => {
    mocks.listSkillsWithTools.mockResolvedValue(SKILLS);
    mocks.patchOrgSkill.mockResolvedValue(skillDetail({ name: 'tienda' }));
    mocks.createOrgSkill.mockResolvedValue(skillDetail({ name: 'nueva' }));
    mocks.getSkill.mockResolvedValue(skillDetail({ name: 'tienda' }));
    mocks.getPublishPreview.mockResolvedValue(publishPreview());
    mocks.publishOrgSkill.mockResolvedValue(skillDetail({ name: 'tienda' }));
    mocks.listSkillVersions.mockResolvedValue({ versions: VERSIONS, total: VERSIONS.length });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('respeta el orden de la API: 1.10.0 antes que 1.9.0', async () => {
    const dialog = await openHistory();
    expect(historyRows().map((el) => el.getAttribute('data-version'))).toEqual(['1.10.0', '1.9.0']);
    expect(within(dialog).getAllByText(/^v1\.10\.0$/).length).toBeGreaterThan(0);
  });

  it('marca la versión vigente', async () => {
    const dialog = await openHistory();
    const current = dialog.querySelector('[data-version="1.10.0"]') as HTMLElement;
    const older = dialog.querySelector('[data-version="1.9.0"]') as HTMLElement;
    expect(within(current).queryByText('Vigente')).not.toBeNull();
    expect(within(older).queryByText('Vigente')).toBeNull();
  });

  it('un changelog nulo no rompe la vista', async () => {
    const dialog = await openHistory();
    const older = dialog.querySelector('[data-version="1.9.0"]') as HTMLElement;
    expect(within(older).queryByText(/null/)).toBeNull();
    expect(within(older).getByText(/—/)).not.toBeNull();
  });

  it('sin versiones muestra un estado vacío', async () => {
    mocks.listSkillVersions.mockResolvedValue({ versions: [], total: 0 });
    renderWithI18n(<SkillsPage />, 'es');
    await waitFor(() => expect(screen.queryAllByTestId('skill-row').length).toBe(SKILLS.length));
    fireEvent.click(within(row('tienda')).getByText('Historial'));
    await screen.findByRole('dialog');
    await waitFor(() =>
      expect(screen.queryByText('Esta skill todavía no tiene versiones.')).not.toBeNull(),
    );
  });

  it('no muestra published_by', async () => {
    mocks.listSkillVersions.mockResolvedValue({
      versions: [versionRecord({ version: '1.0.0', published_by: 'u-secret' })],
      total: 1,
    });
    await openHistory();
    expect(screen.queryByText('u-secret')).toBeNull();
  });

  it('muestra el tipo y las tools con frases en lenguaje claro', async () => {
    const dialog = await openHistory();
    const newer = dialog.querySelector('[data-version="1.10.0"]') as HTMLElement;
    const older = dialog.querySelector('[data-version="1.9.0"]') as HTMLElement;
    expect(within(older).queryByText('Primera versión')).not.toBeNull();
    expect(within(newer).getByText(/Crea cotizaciones/)).not.toBeNull();
    expect(within(newer).queryByText(/quotes\.create/)).toBeNull();
    expect(within(older).getByText(/Consulta productos/)).not.toBeNull();
  });

  it('M10: la fecha sale con el formato del idioma activo (es y en)', async () => {
    const iso = '2026-01-01T00:00:00Z';
    const fmt = (locale: Locale) =>
      new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));

    await openHistory('tienda', 'es');
    let older = document.querySelector('[data-version="1.9.0"]') as HTMLElement;
    expect(within(older).queryByText(new RegExp(iso))).toBeNull();
    expect(within(older).getByText(fmt('es'))).not.toBeNull();
    cleanup();

    await openHistory('tienda', 'en');
    older = document.querySelector('[data-version="1.9.0"]') as HTMLElement;
    expect(within(older).queryByText(new RegExp(iso))).toBeNull();
    expect(within(older).getByText(fmt('en'))).not.toBeNull();
  });

  it('M12: con error, el historial NO muestra el texto de vacío', async () => {
    mocks.listSkillVersions.mockRejectedValueOnce(Object.assign(new Error('boom'), { status: 500 }));
    renderWithI18n(<SkillsPage />, 'es');
    await waitFor(() => expect(screen.queryAllByTestId('skill-row').length).toBe(SKILLS.length));
    fireEvent.click(within(row('tienda')).getByText('Historial'));
    await screen.findByRole('dialog');
    await waitFor(() =>
      expect(screen.queryByText('No se pudo guardar. Intenta de nuevo.')).not.toBeNull(),
    );
    expect(screen.queryByText('Esta skill todavía no tiene versiones.')).toBeNull();
  });

  it('M6: un historial atrasado de otra skill se descarta', async () => {
    let resolveTienda!: (v: unknown) => void;
    mocks.listSkillVersions.mockImplementationOnce(
      () => new Promise((res) => { resolveTienda = res; }),
    );
    mocks.listSkillVersions.mockImplementationOnce(() =>
      Promise.resolve({ versions: [versionRecord({ version: '7.0.0' })], total: 1 }),
    );
    renderWithI18n(<SkillsPage />, 'es');
    await waitFor(() => expect(screen.queryAllByTestId('skill-row').length).toBe(SKILLS.length));

    fireEvent.click(within(row('tienda')).getByText('Historial'));
    await screen.findByRole('dialog');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    fireEvent.click(within(row('otra')).getByText('Historial'));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(historyRows().length).toBe(1));
    expect(historyRows()[0].getAttribute('data-version')).toBe('7.0.0');

    // llega la respuesta atrasada de 'tienda': se descarta.
    resolveTienda({ versions: VERSIONS, total: VERSIONS.length });
    await waitFor(() => expect(dialog.querySelectorAll('[data-testid="history-row"]').length).toBe(1));
    expect(dialog.querySelector('[data-version="1.9.0"]')).toBeNull();
  });
});

