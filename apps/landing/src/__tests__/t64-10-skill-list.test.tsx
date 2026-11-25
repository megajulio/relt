import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';

/**
 * T64-10 (Orden #64 · ANEXO-64-F · F-3) — lista de skills.
 * El orden RELT → activas → borradores → archivadas; las acciones de cada estado, también
 * las que no salen; «Publicar» en una activa solo con cambios; restaurar a activa y a
 * borrador; el refresco y el aviso tras crear, editar, archivar, restaurar y publicar; un
 * 4xx sin aviso de éxito en las cinco; dos clics = un pedido en guardar, archivar y
 * restaurar; «Cambios sin publicar» solo en las activas (M9); el refresco que falla (M7);
 * y editar sin tocar las instrucciones manda las mismas del detalle (M3).
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
  orgSkill({ name: 'archivada', display_name: 'Archivada', status: 'archived', current_version: '1.0.0', has_unpublished_changes: false, latest_version: '9' }),
  repoSkill(),
  orgSkill({ name: 'borrador', display_name: 'Borrador', status: 'draft', current_version: null, has_unpublished_changes: true, published_tools: null, latest_version: '1' }),
  orgSkill({ name: 'activa', display_name: 'Activa', status: 'active', current_version: '1.2.0', has_unpublished_changes: true, latest_version: '7' }),
  orgSkill({ name: 'activa-sin', display_name: 'Activa sin cambios', status: 'active', current_version: '2.0.0', has_unpublished_changes: false, latest_version: '8' }),
];

async function renderPage() {
  renderWithI18n(<SkillsPage />, 'es');
  await waitFor(() => expect(screen.queryAllByText('De RELT').length).toBeGreaterThan(0));
}

async function startEdit(name: string) {
  fireEvent.click(within(row(name)).getByText('Editar'));
  await waitFor(() =>
    expect((screen.getByLabelText(/Cómo hacer la tarea/) as HTMLTextAreaElement).value).not.toBe(''),
  );
}

describe('T64-10 · lista de skills', () => {
  beforeEach(() => {
    mocks.listSkillsWithTools.mockResolvedValue(SKILLS);
    mocks.patchOrgSkill.mockResolvedValue(skillDetail({ name: 'activa' }));
    mocks.createOrgSkill.mockResolvedValue(skillDetail({ name: 'nueva' }));
    mocks.getSkill.mockResolvedValue(skillDetail({ name: 'activa', instructions: 'Pasos de la tienda' }));
    mocks.getPublishPreview.mockResolvedValue(publishPreview());
    mocks.publishOrgSkill.mockResolvedValue(skillDetail({ name: 'activa' }));
    mocks.listSkillVersions.mockResolvedValue({ versions: [], total: 0 });
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('el orden es RELT → activas → borradores → archivadas', async () => {
    await renderPage();
    const names = Array.from(document.querySelectorAll('[data-testid="skill-row"]')).map((el) =>
      el.getAttribute('data-name'),
    );
    expect(names).toEqual(['general', 'activa', 'activa-sin', 'borrador', 'archivada']);
  });

  it('muestra el estado, la current_version y «Cambios sin publicar»', async () => {
    await renderPage();
    expect(within(row('activa')).getByTestId('skill-state').textContent).toContain('Activa');
    expect(within(row('activa')).getByTestId('skill-state').textContent).toContain('Cambios sin publicar');
    expect(within(row('borrador')).getByTestId('skill-state').textContent).toContain('Borrador');
    expect(within(row('archivada')).getByTestId('skill-state').textContent).toContain('Archivada');
    expect(within(row('activa')).getByText('1.2.0')).not.toBeNull();
    expect(within(row('borrador')).getByText('Sin publicar')).not.toBeNull();
    expect(within(row('activa')).queryByText('7')).toBeNull();
  });

  it('M9: «Cambios sin publicar» NO sale en borradores ni archivadas', async () => {
    await renderPage();
    expect(within(row('borrador')).getByTestId('skill-state').textContent).not.toContain('Cambios sin publicar');
    expect(within(row('archivada')).getByTestId('skill-state').textContent).not.toContain('Cambios sin publicar');
    expect(within(row('activa')).getByTestId('skill-state').textContent).toContain('Cambios sin publicar');
  });

  it('las acciones dependen del estado, también las que no salen', async () => {
    await renderPage();

    const draft = within(row('borrador'));
    expect(draft.queryByText('Editar')).not.toBeNull();
    expect(draft.queryByText('Publicar')).not.toBeNull();
    expect(draft.queryByText('Archivar')).not.toBeNull();
    expect(draft.queryByText('Historial')).toBeNull();
    expect(draft.queryByText('Restaurar')).toBeNull();

    const active = within(row('activa'));
    expect(active.queryByText('Editar')).not.toBeNull();
    expect(active.queryByText('Publicar')).not.toBeNull();
    expect(active.queryByText('Historial')).not.toBeNull();
    expect(active.queryByText('Archivar')).not.toBeNull();
    expect(active.queryByText('Restaurar')).toBeNull();

    const archived = within(row('archivada'));
    expect(archived.queryByText('Restaurar')).not.toBeNull();
    expect(archived.queryByText('Historial')).not.toBeNull();
    expect(archived.queryByText('Editar')).toBeNull();
    expect(archived.queryByText('Publicar')).toBeNull();
    expect(archived.queryByText('Archivar')).toBeNull();

    const repo = within(row('general'));
    expect(repo.queryAllByText('Solo lectura').length).toBeGreaterThan(0);
    expect(repo.queryByText('Editar')).toBeNull();
  });

  it('«Publicar» en una activa sale solo si hay cambios sin publicar', async () => {
    await renderPage();
    expect(within(row('activa')).queryByText('Publicar')).not.toBeNull();
    expect(within(row('activa-sin')).queryByText('Publicar')).toBeNull();
  });

  it('restaurar avisa según el estado de la RESPUESTA (activa o borrador)', async () => {
    await renderPage();
    mocks.patchOrgSkill.mockResolvedValueOnce(skillDetail({ status: 'active' }));
    fireEvent.click(within(row('archivada')).getByText('Restaurar'));
    await waitFor(() => expect(screen.queryByText('Skill restaurada y activa.')).not.toBeNull());

    mocks.patchOrgSkill.mockResolvedValueOnce(skillDetail({ status: 'draft' }));
    fireEvent.click(within(row('archivada')).getByText('Restaurar'));
    await waitFor(() => expect(screen.queryByText('Skill restaurada como borrador.')).not.toBeNull());
  });

  it('el PATCH de edición no manda name ni base_skill', async () => {
    await renderPage();
    await startEdit('activa');
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText('Skill base') as HTMLSelectElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(mocks.patchOrgSkill).toHaveBeenCalled());
    const [name, patch] = mocks.patchOrgSkill.mock.calls[0];
    expect(name).toBe('activa');
    expect(Object.prototype.hasOwnProperty.call(patch, 'name')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, 'base_skill')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(patch, 'baseSkill')).toBe(false);
  });

  it('M3: editar sin tocar las instrucciones manda las MISMAS del detalle', async () => {
    await renderPage();
    mocks.getSkill.mockResolvedValueOnce(skillDetail({ name: 'activa', instructions: 'Pasos guardados' }));
    await startEdit('activa');
    expect(mocks.getSkill).toHaveBeenCalledWith('activa');
    expect((screen.getByLabelText(/Cómo hacer la tarea/) as HTMLTextAreaElement).value).toBe('Pasos guardados');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(mocks.patchOrgSkill).toHaveBeenCalled());
    const [, patch] = mocks.patchOrgSkill.mock.calls[0];
    expect(patch.instructions).toBe('Pasos guardados');
  });

  it('M3: con el detalle fallando NO se puede guardar y se explica', async () => {
    await renderPage();
    mocks.getSkill.mockRejectedValueOnce(
      Object.assign(new Error('nope'), { status: 404, code: 'skill_not_found' }),
    );
    fireEvent.click(within(row('activa')).getByText('Editar'));
    await waitFor(() => expect(screen.queryByText('Esa skill no existe o no está disponible.')).not.toBeNull());
    const guardar = screen.getByRole('button', { name: 'Guardar' }) as HTMLButtonElement;
    expect(guardar.disabled).toBe(true);
    fireEvent.click(guardar);
    expect(mocks.patchOrgSkill).not.toHaveBeenCalled();
  });


  it('crear avisa que quedó en borrador y que hay que publicarla', async () => {
    await renderPage();
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'nueva-skill' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() =>
      expect(
        screen.queryByText('Skill creada en borrador. Publícala para poder usarla.'),
      ).not.toBeNull(),
    );
  });

  it('editar avisa que el cambio no se usa hasta publicarlo', async () => {
    await renderPage();
    await startEdit('activa');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() =>
      expect(
        screen.queryByText('Skill actualizada. El cambio no se usa hasta publicarla.'),
      ).not.toBeNull(),
    );
  });

  it('tras cada acción se vuelve a pedir la lista', async () => {
    await renderPage();
    expect(mocks.listSkillsWithTools).toHaveBeenCalledTimes(1);
    fireEvent.click(within(row('activa-sin')).getByText('Archivar'));
    await waitFor(() => expect(mocks.listSkillsWithTools).toHaveBeenCalledTimes(2));
  });

  it('M7: si el refresco falla, el aviso de éxito se conserva y se muestra el error de carga', async () => {
    await renderPage();
    mocks.listSkillsWithTools.mockRejectedValueOnce(new Error('red'));
    fireEvent.click(within(row('activa-sin')).getByText('Archivar'));
    await waitFor(() => expect(screen.queryByText('Skill archivada.')).not.toBeNull());
    await waitFor(() => expect(screen.queryByText('No se pudieron cargar las skills.')).not.toBeNull());
    // El aviso de éxito sigue ahí (no se sustituye por «no se pudo guardar»).
    expect(screen.queryByText('Skill archivada.')).not.toBeNull();
    expect(screen.queryByText('No se pudo guardar. Intenta de nuevo.')).toBeNull();
  });

  it('M12: mientras se publica, las acciones de la lista quedan deshabilitadas', async () => {
    await renderPage();
    fireEvent.click(within(row('activa')).getByText('Publicar'));
    await screen.findByRole('dialog');
    expect((within(row('activa-sin')).getByText('Archivar') as HTMLButtonElement).disabled).toBe(true);
    expect((within(row('archivada')).getByText('Restaurar') as HTMLButtonElement).disabled).toBe(true);
    expect((within(row('borrador')).getByText('Editar') as HTMLButtonElement).disabled).toBe(true);
  });


  it('un 4xx al archivar no da aviso de éxito', async () => {
    await renderPage();
    mocks.patchOrgSkill.mockRejectedValueOnce(
      Object.assign(new Error('in use'), { status: 409, code: 'skill_in_use', meta: { agents: 3 } }),
    );
    fireEvent.click(within(row('activa-sin')).getByText('Archivar'));
    await waitFor(() => expect(screen.queryByText('La usan 3 agentes.')).not.toBeNull());
    expect(screen.queryByText('Skill archivada.')).toBeNull();
  });

  it('un 4xx al restaurar no da aviso de éxito', async () => {
    await renderPage();
    mocks.patchOrgSkill.mockRejectedValueOnce(Object.assign(new Error('forbidden'), { status: 403 }));
    fireEvent.click(within(row('archivada')).getByText('Restaurar'));
    await waitFor(() =>
      expect(
        screen.queryByText('Tu rol no permite crear ni editar skills. Pídeselo a un administrador.'),
      ).not.toBeNull(),
    );
    expect(screen.queryByText('Skill restaurada y activa.')).toBeNull();
    expect(screen.queryByText('Skill restaurada como borrador.')).toBeNull();
  });

  it('un 4xx al crear no da aviso de éxito', async () => {
    await renderPage();
    mocks.createOrgSkill.mockRejectedValueOnce(
      Object.assign(new Error('taken'), { status: 409, code: 'skill_name_taken' }),
    );
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'nueva-skill' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.queryByText('Ya tienes una skill con ese nombre.')).not.toBeNull());
    expect(screen.queryByText('Skill creada en borrador. Publícala para poder usarla.')).toBeNull();
  });

  it('un 4xx al editar no da aviso de éxito', async () => {
    await renderPage();
    await startEdit('activa');
    mocks.patchOrgSkill.mockRejectedValueOnce(
      Object.assign(new Error('read only'), { status: 400, code: 'field_read_only', field: 'name' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.queryByText('El campo name no se puede cambiar.')).not.toBeNull());
    expect(screen.queryByText('Skill actualizada. El cambio no se usa hasta publicarla.')).toBeNull();
  });

  it('un 4xx al publicar no da aviso de éxito', async () => {
    await renderPage();
    fireEvent.click(within(row('activa')).getByText('Publicar'));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(within(dialog).getByText('1.3.0')).not.toBeNull());
    mocks.publishOrgSkill.mockRejectedValueOnce(
      Object.assign(new Error('conflict'), { status: 409, code: 'publish_conflict' }),
    );
    fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(mocks.publishOrgSkill).toHaveBeenCalled());
    expect(screen.queryByText('Skill publicada.')).toBeNull();
  });

  it('dos clics = un pedido en guardar, archivar y restaurar', async () => {
    // guardar
    await renderPage();
    await startEdit('activa');
    mocks.patchOrgSkill.mockImplementation(() => new Promise(() => {}));
    const guardar = screen.getByRole('button', { name: 'Guardar' });
    fireEvent.click(guardar);
    fireEvent.click(guardar);
    await waitFor(() => expect(mocks.patchOrgSkill).toHaveBeenCalledTimes(1));
    expect(mocks.patchOrgSkill).toHaveBeenCalledTimes(1);
    cleanup();

    // archivar
    mocks.patchOrgSkill.mockReset();
    mocks.patchOrgSkill.mockImplementation(() => new Promise(() => {}));
    await renderPage();
    const archivar = within(row('activa-sin')).getByText('Archivar');
    fireEvent.click(archivar);
    fireEvent.click(archivar);
    await waitFor(() => expect(mocks.patchOrgSkill).toHaveBeenCalledTimes(1));
    expect(mocks.patchOrgSkill).toHaveBeenCalledTimes(1);
    cleanup();

    // restaurar
    mocks.patchOrgSkill.mockReset();
    mocks.patchOrgSkill.mockImplementation(() => new Promise(() => {}));
    await renderPage();
    const restaurar = within(row('archivada')).getByText('Restaurar');
    fireEvent.click(restaurar);
    fireEvent.click(restaurar);
    await waitFor(() => expect(mocks.patchOrgSkill).toHaveBeenCalledTimes(1));
    expect(mocks.patchOrgSkill).toHaveBeenCalledTimes(1);
  });
});

