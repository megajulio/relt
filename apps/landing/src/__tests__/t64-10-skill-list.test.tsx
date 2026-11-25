import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';

/**
 * T64-10 (Orden #64 · ANEXO-64-E · E-3) — lista de skills.
 * El orden RELT → activas → borradores → archivadas; las acciones de cada estado,
 * también las que no salen; «Publicar» en una activa solo con cambios; restaurar a
 * activa y a borrador; el refresco tras cada acción; un 4xx no da aviso de éxito; el
 * `PATCH` de edición no lleva `name` ni `base_skill`.
 */

const REPO = {
  name: 'general', latest_version: '1.0.0', description: 'General', tools_count: 1,
  permissions: ['products:read'], triggers: [], kind: 'repo', tools: ['products.search'],
};

function org(over: Record<string, unknown>) {
  return {
    description: 'De la org', tools_count: 1, permissions: ['products:read'], triggers: [],
    kind: 'org', base_skill: 'general', allowed_tools: ['products.search'],
    tools: ['products.search'], published_tools: ['products.search'],
    ...over,
  };
}

const SKILLS = [
  org({ name: 'archivada', display_name: 'Archivada', status: 'archived', current_version: '1.0.0', has_unpublished_changes: false, latest_version: '9' }),
  REPO,
  org({ name: 'borrador', display_name: 'Borrador', status: 'draft', current_version: null, has_unpublished_changes: true, published_tools: null, latest_version: '1' }),
  org({ name: 'activa', display_name: 'Activa', status: 'active', current_version: '1.2.0', has_unpublished_changes: true, latest_version: '7' }),
  org({ name: 'activa-sin', display_name: 'Activa sin cambios', status: 'active', current_version: '2.0.0', has_unpublished_changes: false, latest_version: '8' }),
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

function row(name: string): HTMLElement {
  const el = document.querySelector(`[data-testid="skill-row"][data-name="${name}"]`);
  if (!el) throw new Error(`fila no encontrada: ${name}`);
  return el as HTMLElement;
}

async function renderPage() {
  renderWithI18n(<SkillsPage />, 'es');
  await waitFor(() => expect(screen.queryAllByText('De RELT').length).toBeGreaterThan(0));
}

describe('T64-10 · lista de skills', () => {
  beforeEach(() => {
    mocks.listSkillsWithTools.mockResolvedValue(SKILLS);
    mocks.patchOrgSkill.mockResolvedValue({ status: 'active' });
    mocks.createOrgSkill.mockResolvedValue({});
    mocks.getPublishPreview.mockResolvedValue({ next_version: '1.3.0', bump: 'minor', added_tools: [], removed_tools: [], agents_on_latest: 0 });
    mocks.publishOrgSkill.mockResolvedValue({});
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
    mocks.patchOrgSkill.mockResolvedValueOnce({ status: 'active' });
    fireEvent.click(within(row('archivada')).getByText('Restaurar'));
    await waitFor(() => expect(screen.queryByText('Skill restaurada y activa.')).not.toBeNull());

    mocks.patchOrgSkill.mockResolvedValueOnce({ status: 'draft' });
    fireEvent.click(within(row('archivada')).getByText('Restaurar'));
    await waitFor(() => expect(screen.queryByText('Skill restaurada como borrador.')).not.toBeNull());
  });

  it('tras cada acción se vuelve a pedir la lista', async () => {
    await renderPage();
    expect(mocks.listSkillsWithTools).toHaveBeenCalledTimes(1);
    fireEvent.click(within(row('activa-sin')).getByText('Archivar'));
    await waitFor(() => expect(mocks.listSkillsWithTools).toHaveBeenCalledTimes(2));
  });

  it('un 4xx no da aviso de éxito', async () => {
    await renderPage();
    mocks.patchOrgSkill.mockRejectedValueOnce(
      Object.assign(new Error('in use'), { status: 409, code: 'skill_in_use', meta: { agents: 3 } }),
    );
    fireEvent.click(within(row('activa-sin')).getByText('Archivar'));
    await waitFor(() => expect(screen.queryByText('La usan 3 agentes.')).not.toBeNull());
    expect(screen.queryByText('Skill archivada.')).toBeNull();
  });

  it('el PATCH de edición no manda name ni base_skill', async () => {
    await renderPage();
    fireEvent.click(within(row('activa')).getByText('Editar'));
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

  it('crear avisa que quedó en borrador y que hay que publicarla', async () => {
    await renderPage();
    mocks.createOrgSkill.mockResolvedValueOnce({});
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
    fireEvent.click(within(row('activa')).getByText('Editar'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() =>
      expect(
        screen.queryByText('Skill actualizada. El cambio no se usa hasta publicarla.'),
      ).not.toBeNull(),
    );
  });

  it('los roles: un 403 se muestra en lenguaje claro', async () => {
    await renderPage();
    mocks.patchOrgSkill.mockRejectedValueOnce(
      Object.assign(new Error('forbidden'), { status: 403 }),
    );
    fireEvent.click(within(row('activa-sin')).getByText('Archivar'));
    await waitFor(() =>
      expect(
        screen.queryByText('Tu rol no permite crear ni editar skills. Pídeselo a un administrador.'),
      ).not.toBeNull(),
    );
  });
});
