import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';

/**
 * T64-11 (Orden #64 · ANEXO-64-F · F-3) — publicar.
 * M1: `openDialog` espera a que la vista previa ESTÉ CARGADA, y «sin aviso» se afirma
 * después de ver la versión. Además: `expected_version` en el pedido; MAJOR con N = 0, 1 y
 * 2; MINOR y PATCH sin aviso; `publish_conflict` pide otra vista previa y NO publica solo
 * (y si la segunda falla, se muestra SU error); `nothing_to_publish` y `skill_archived` al
 * abrir; `field_too_long`; 280 y 281 con emoji; las frases de las tools; modal, foco y
 * Escape; dos clics = un POST; y una respuesta atrasada (M6).
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
import { orgSkill, publishPreview, repoSkill, skillDetail } from './t64-fixtures';
import { renderWithI18n } from './render-with-i18n';

function row(name: string): HTMLElement {
  const el = document.querySelector(`[data-testid="skill-row"][data-name="${name}"]`);
  if (!el) throw new Error(`fila no encontrada: ${name}`);
  return el as HTMLElement;
}

const SKILLS = [
  repoSkill(),
  orgSkill({ name: 'tienda', display_name: 'Tienda', status: 'active', has_unpublished_changes: true }),
  orgSkill({ name: 'otra', display_name: 'Otra', status: 'active', has_unpublished_changes: true }),
];

/** M1: abre el diálogo y ESPERA a que la vista previa esté cargada (la versión visible). */
async function openDialog(name = 'tienda') {
  fireEvent.click(within(row(name)).getByText('Publicar'));
  const dialog = await screen.findByRole('dialog');
  await waitFor(() =>
    expect(within(dialog).getByTestId('preview-version').textContent).not.toBe(''),
  );
  return dialog;
}

describe('T64-11 · publicar', () => {
  beforeEach(async () => {
    mocks.listSkillsWithTools.mockResolvedValue(SKILLS);
    mocks.patchOrgSkill.mockResolvedValue(skillDetail({ name: 'tienda' }));
    mocks.createOrgSkill.mockResolvedValue(skillDetail({ name: 'nueva' }));
    mocks.getSkill.mockResolvedValue(skillDetail({ name: 'tienda' }));
    mocks.getPublishPreview.mockResolvedValue(publishPreview());
    mocks.publishOrgSkill.mockResolvedValue({
      ...skillDetail({ name: 'tienda' }),
      published_version: '1.3.0',
      bump: 'minor',
      changelog: null,
    });
    mocks.listSkillVersions.mockResolvedValue({ versions: [], total: 0 });
    renderWithI18n(<SkillsPage />, 'es');
    await waitFor(() => expect(screen.queryAllByText('De RELT').length).toBeGreaterThan(0));
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('al abrir pide la vista previa y la muestra (versión, tipo, tools y changelog)', async () => {
    mocks.getPublishPreview.mockResolvedValueOnce(publishPreview({ added_tools: ['quotes.create'] }));
    const dialog = await openDialog();
    expect(mocks.getPublishPreview).toHaveBeenCalledWith('tienda');
    expect(within(dialog).getByTestId('preview-version').textContent).toBe('1.3.0');
    expect(within(dialog).getByText('Menor (agrega capacidades)')).not.toBeNull();
    expect(within(dialog).getByText(/Crea cotizaciones/)).not.toBeNull();
    expect(within(dialog).getByLabelText(/Notas de la versión/)).not.toBeNull();
  });

  it('manda expected_version = la versión de la vista previa', async () => {
    const dialog = await openDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(mocks.publishOrgSkill).toHaveBeenCalled());
    expect(mocks.publishOrgSkill.mock.calls[0][0]).toBe('tienda');
    expect(mocks.publishOrgSkill.mock.calls[0][1].expected_version).toBe('1.3.0');
  });

  it('«Skill publicada.» y el refresco con 201', async () => {
    const dialog = await openDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(screen.queryByText('Skill publicada.')).not.toBeNull());
    expect(mocks.listSkillsWithTools).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('MAJOR avisa con N = 0, 1 y 2', async () => {
    const cases: Array<[number, string]> = [
      [0, 'Ningún agente usa la última versión; se van a quitar capacidades.'],
      [1, '1 agente usa la última versión y va a perder capacidades.'],
      [2, '2 agentes usan la última versión y van a perder capacidades.'],
    ];
    for (const [n, text] of cases) {
      mocks.getPublishPreview.mockResolvedValueOnce(
        publishPreview({ next_version: '2.0.0', bump: 'major', removed_tools: ['quotes.create'], agents_on_latest: n }),
      );
      const dialog = await openDialog();
      expect(within(dialog).getByText(text)).not.toBeNull();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    }
  });

  it('MINOR y PATCH no llevan aviso MAJOR (después de ver la versión)', async () => {
    for (const [bump, version] of [['minor', '1.3.0'], ['patch', '1.2.1']] as const) {
      mocks.getPublishPreview.mockResolvedValueOnce(publishPreview({ next_version: version, bump }));
      const dialog = await openDialog();
      expect(within(dialog).getByTestId('preview-version').textContent).toBe(version);
      expect(within(dialog).queryByText(/perder capacidades/)).toBeNull();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    }
  });

  it('las tools salen con frases en lenguaje claro (agregadas y quitadas)', async () => {
    mocks.getPublishPreview.mockResolvedValueOnce(
      publishPreview({ bump: 'major', added_tools: ['quotes.create'], removed_tools: ['customers.lookup'] }),
    );
    const dialog = await openDialog();
    expect(within(dialog).getByText(/Crea cotizaciones/)).not.toBeNull();
    expect(within(dialog).getByText(/Busca datos de clientes/)).not.toBeNull();
    expect(within(dialog).queryByText(/quotes\.create/)).toBeNull();
  });

  it('sin tools en una lista, dice «Ninguna»', async () => {
    const dialog = await openDialog();
    expect(within(dialog).getAllByText(/Ninguna/).length).toBeGreaterThanOrEqual(2);
  });

  it('el contador del changelog es de 280 code points (con emoji)', async () => {
    const dialog = await openDialog();
    const ta = within(dialog).getByLabelText(/Notas de la versión/) as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '😀'.repeat(280) } });
    expect(within(dialog).getByText('280/280')).not.toBeNull();
    fireEvent.change(ta, { target: { value: '😀'.repeat(281) } });
    expect(within(dialog).getByText('281/280')).not.toBeNull();
  });


  it('publish_conflict pide otra vista previa y NO publica solo', async () => {
    const dialog = await openDialog();
    mocks.publishOrgSkill.mockRejectedValueOnce(
      Object.assign(new Error('conflict'), { status: 409, code: 'publish_conflict' }),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }));
    await waitFor(() =>
      expect(
        within(dialog).queryByText(
          'Alguien publicó otra versión mientras mirabas. Revisa la vista previa otra vez.',
        ),
      ).not.toBeNull(),
    );
    expect(mocks.publishOrgSkill).toHaveBeenCalledTimes(1);
    expect(mocks.getPublishPreview).toHaveBeenCalledTimes(2);
    // el diálogo sigue abierto: el usuario confirma de nuevo
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });

  it('F-2.10: si la segunda vista previa FALLA, se muestra SU error y no el de conflicto', async () => {
    const dialog = await openDialog();
    mocks.publishOrgSkill.mockRejectedValueOnce(
      Object.assign(new Error('conflict'), { status: 409, code: 'publish_conflict' }),
    );
    mocks.getPublishPreview.mockRejectedValueOnce(Object.assign(new Error('boom'), { status: 500 }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(mocks.getPublishPreview).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(within(dialog).getByText('No se pudo guardar. Intenta de nuevo.')).not.toBeNull());
    expect(
      within(dialog).queryByText('Alguien publicó otra versión mientras mirabas. Revisa la vista previa otra vez.'),
    ).toBeNull();
  });

  it('409 nothing_to_publish al abrir: lo explica y refresca la lista', async () => {
    mocks.getPublishPreview.mockRejectedValueOnce(
      Object.assign(new Error('nada'), { status: 409, code: 'nothing_to_publish' }),
    );
    fireEvent.click(within(row('tienda')).getByText('Publicar'));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(within(dialog).getByText('No hay cambios que publicar.')).not.toBeNull());
    await waitFor(() => expect(mocks.listSkillsWithTools).toHaveBeenCalledTimes(2));
  });

  it('409 skill_archived al abrir: lo explica y refresca la lista', async () => {
    mocks.getPublishPreview.mockRejectedValueOnce(
      Object.assign(new Error('arch'), { status: 409, code: 'skill_archived' }),
    );
    fireEvent.click(within(row('tienda')).getByText('Publicar'));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() =>
      expect(within(dialog).getByText('La skill está archivada y no se puede publicar.')).not.toBeNull(),
    );
    await waitFor(() => expect(mocks.listSkillsWithTools).toHaveBeenCalledTimes(2));
  });

  it('field_too_long (changelog) usa el texto de las notas de la versión', async () => {
    const dialog = await openDialog();
    mocks.publishOrgSkill.mockRejectedValueOnce(
      Object.assign(new Error('long'), { status: 400, code: 'field_too_long', field: 'changelog' }),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }));
    await waitFor(() =>
      expect(
        within(dialog).getByText('Las notas de la versión son demasiado largas (máximo 280 caracteres).'),
      ).not.toBeNull(),
    );
  });

  it('invalid_field pone el error con su campo', async () => {
    const dialog = await openDialog();
    mocks.publishOrgSkill.mockRejectedValueOnce(
      Object.assign(new Error('bad'), { status: 400, code: 'invalid_field', field: 'expected_version' }),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }));
    await waitFor(() =>
      expect(
        within(dialog).getByText('El campo expected_version tiene un valor que no es válido.'),
      ).not.toBeNull(),
    );
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


  it('M8: es un diálogo modal, con el foco dentro y se cierra con Escape', async () => {
    const dialog = await openDialog();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('M8: mientras se publica, Escape NO cierra el diálogo', async () => {
    mocks.publishOrgSkill.mockImplementation(() => new Promise(() => {}));
    const dialog = await openDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(mocks.publishOrgSkill).toHaveBeenCalled());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });

  it('M6: una vista previa atrasada de otra skill se descarta', async () => {
    let resolveTienda!: (v: unknown) => void;
    mocks.getPublishPreview.mockImplementationOnce(
      () => new Promise((res) => { resolveTienda = res; }),
    );
    mocks.getPublishPreview.mockImplementationOnce(() =>
      Promise.resolve(publishPreview({ next_version: '5.0.0', bump: 'major' })),
    );
    fireEvent.click(within(row('tienda')).getByText('Publicar'));
    await screen.findByRole('dialog');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    fireEvent.click(within(row('otra')).getByText('Publicar'));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(within(dialog).getByTestId('preview-version').textContent).toBe('5.0.0'));

    // llega la respuesta atrasada de 'tienda': se descarta.
    resolveTienda(publishPreview({ next_version: '9.9.9', bump: 'major' }));
    await waitFor(() => expect(within(dialog).queryByText('9.9.9')).toBeNull());
    expect(within(dialog).getByTestId('preview-version').textContent).toBe('5.0.0');
  });
});

