import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';

/**
 * T64-11 (Orden #64 · ANEXO-64-E · E-3) — publicar.
 * La vista previa; `expected_version` en el pedido; MAJOR con N = 0, 1 y 2; MINOR y
 * PATCH sin aviso; `publish_conflict` pide otra vista previa y no publica solo;
 * `nothing_to_publish`; `field_too_long`; 280 y 281; dos clics = un `POST`.
 */

const REPO = {
  name: 'general', latest_version: '1.0.0', description: 'General', tools_count: 1,
  permissions: ['products:read'], triggers: [], kind: 'repo', tools: ['products.search'],
};

const TIENDA = {
  name: 'tienda', latest_version: '3', description: 'Tienda', tools_count: 1,
  permissions: ['products:read'], triggers: [], kind: 'org', display_name: 'Tienda',
  base_skill: 'general', allowed_tools: ['products.search'], tools: ['products.search'],
  status: 'active', current_version: '1.2.0', has_unpublished_changes: true,
  published_tools: ['products.search'],
};

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

function row(name: string): HTMLElement {
  const el = document.querySelector(`[data-testid="skill-row"][data-name="${name}"]`);
  if (!el) throw new Error(`fila no encontrada: ${name}`);
  return el as HTMLElement;
}

function preview(over: Record<string, unknown> = {}) {
  return { next_version: '1.3.0', bump: 'minor', added_tools: ['quotes.create'], removed_tools: [], agents_on_latest: 0, ...over };
}

async function openDialog() {
  renderWithI18n(<SkillsPage />, 'es');
  await waitFor(() => expect(screen.queryAllByText('De RELT').length).toBeGreaterThan(0));
  fireEvent.click(within(row('tienda')).getByText('Publicar'));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeNull());
  return screen.getByRole('dialog');
}

describe('T64-11 · publicar', () => {
  beforeEach(() => {
    mocks.listSkillsWithTools.mockResolvedValue([REPO, TIENDA]);
    mocks.patchOrgSkill.mockResolvedValue({ status: 'active' });
    mocks.createOrgSkill.mockResolvedValue({});
    mocks.getPublishPreview.mockResolvedValue(preview());
    mocks.publishOrgSkill.mockResolvedValue({});
    mocks.listSkillVersions.mockResolvedValue({ versions: [], total: 0 });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('al abrir pide la vista previa y la muestra (versión, tipo, tools y changelog)', async () => {
    const dialog = await openDialog();
    expect(mocks.getPublishPreview).toHaveBeenCalledWith('tienda');
    expect(within(dialog).getByText('1.3.0')).not.toBeNull();
    expect(within(dialog).getByText('Menor (agrega capacidades)')).not.toBeNull();
    expect(within(dialog).getByText(/quotes\.create/)).not.toBeNull();
    expect(within(dialog).getByLabelText(/Notas de la versión/)).not.toBeNull();
  });

  it('manda expected_version = la versión de la vista previa', async () => {
    const dialog = await openDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(mocks.publishOrgSkill).toHaveBeenCalled());
    expect(mocks.publishOrgSkill.mock.calls[0][0]).toBe('tienda');
    expect(mocks.publishOrgSkill.mock.calls[0][1].expected_version).toBe('1.3.0');
  });

  it('MAJOR avisa con N = 0, 1 y 2', async () => {
    const cases: Array<[number, string]> = [
      [0, 'Ningún agente usa la última versión; se van a quitar capacidades.'],
      [1, '1 agente usa la última versión y va a perder capacidades.'],
      [2, '2 agentes usan la última versión y van a perder capacidades.'],
    ];
    for (const [n, text] of cases) {
      mocks.getPublishPreview.mockResolvedValueOnce(
        preview({ next_version: '2.0.0', bump: 'major', removed_tools: ['quotes.create'], added_tools: [], agents_on_latest: n }),
      );
      const dialog = await openDialog();
      expect(within(dialog).getByText(text)).not.toBeNull();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    }
  });

  it('MINOR y PATCH no llevan aviso MAJOR', async () => {
    for (const bump of ['minor', 'patch']) {
      mocks.getPublishPreview.mockResolvedValueOnce(preview({ bump }));
      const dialog = await openDialog();
      expect(within(dialog).queryByText(/perder capacidades/)).toBeNull();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    }
  });

  it('publish_conflict pide otra vista previa y NO publica solo', async () => {
    mocks.publishOrgSkill.mockRejectedValueOnce(
      Object.assign(new Error('conflict'), { status: 409, code: 'publish_conflict' }),
    );
    const dialog = await openDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }));
    await waitFor(() =>
      expect(
        screen.queryByText(
          'Alguien publicó otra versión mientras mirabas. Revisa la vista previa otra vez.',
        ),
      ).not.toBeNull(),
    );
    expect(mocks.publishOrgSkill).toHaveBeenCalledTimes(1);
    expect(mocks.getPublishPreview).toHaveBeenCalledTimes(2);
    // el diálogo sigue abierto: el usuario confirma de nuevo
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });

  it('nothing_to_publish lo explica', async () => {
    mocks.getPublishPreview.mockResolvedValueOnce(preview());
    mocks.publishOrgSkill.mockRejectedValueOnce(
      Object.assign(new Error('nothing'), { status: 409, code: 'nothing_to_publish' }),
    );
    const dialog = await openDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(screen.queryByText('No hay cambios que publicar.')).not.toBeNull());
  });

  it('field_too_long pone el error en el campo', async () => {
    mocks.publishOrgSkill.mockRejectedValueOnce(
      Object.assign(new Error('long'), { status: 400, code: 'field_too_long', field: 'changelog' }),
    );
    const dialog = await openDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(screen.queryByText('El campo changelog es demasiado largo.')).not.toBeNull());
  });

  it('el contador del changelog es de 280 code points', async () => {
    const dialog = await openDialog();
    const ta = within(dialog).getByLabelText(/Notas de la versión/) as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: 'x'.repeat(280) } });
    expect(within(dialog).getByText('280/280')).not.toBeNull();
    fireEvent.change(ta, { target: { value: 'x'.repeat(281) } });
    expect(within(dialog).getByText('281/280')).not.toBeNull();
  });

  it('dos clics en Publicar son un solo POST', async () => {
    mocks.publishOrgSkill.mockImplementation(() => new Promise(() => {}));
    const dialog = await openDialog();
    const button = within(dialog).getByRole('button', { name: 'Publicar' });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(mocks.publishOrgSkill).toHaveBeenCalledTimes(1));
    expect(mocks.publishOrgSkill).toHaveBeenCalledTimes(1);
  });
});
