import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
/**
 * T57-17 (Orden #57 · Bloque 3 · ANEXO-57-G) — página de skills (`/dashboard/skills`).
 * Criterios: las skills del repositorio aparecen de solo lectura; se puede crear desde una
 * base con las tools como checkboxes y el contador n/8000; se puede editar; archivar con 409
 * muestra «La usan N agentes»; los errores aparecen en lenguaje claro.
 */

const SKILLS = [
  { name: 'general', latest_version: '1.0.0', description: 'General', tools_count: 1, permissions: ['products:read'], triggers: [], kind: 'repo', tools: ['products.search'] },
  { name: 'sales-assistant', latest_version: '1.1.1', description: 'Ventas', tools_count: 3, permissions: ['products:read'], triggers: [], kind: 'repo', tools: ['products.search', 'quotes.create', 'customers.lookup'] },
  { name: 'mi-tienda', latest_version: '1', description: 'De la org', tools_count: 1, permissions: ['products:read'], triggers: [], kind: 'org', display_name: 'Mi Tienda', base_skill: 'general', allowed_tools: ['products.search'], tools: ['products.search'] },
];

const { patchOrgSkill } = vi.hoisted(() => ({ patchOrgSkill: vi.fn(async () => ({})) }));

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({}),
}));
vi.mock('@/lib/skills', () => ({
  listSkillsWithTools: vi.fn(async () => SKILLS),
  listSkills: vi.fn(async () => SKILLS),
  getSkill: vi.fn(),
  createOrgSkill: vi.fn(async () => ({})),
  patchOrgSkill,
}));

import SkillsPage from '@/app/dashboard/skills/page';
import { renderWithI18n } from './render-with-i18n';

const render = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, 'es');

describe('T57-17 · página de skills', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('las skills del repositorio aparecen como De RELT y de solo lectura', async () => {
    render(<SkillsPage />);
    await waitFor(() => expect(screen.queryAllByText('De RELT').length).toBeGreaterThan(0));
    expect(screen.queryAllByText('Solo lectura').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('general').length).toBeGreaterThan(0);
  });

  it('se puede crear desde una base: tools como checkboxes y contador n/8000', async () => {
    render(<SkillsPage />);
    await waitFor(() => expect(screen.queryByText('0/8000')).not.toBeNull());
    expect(screen.queryAllByRole('checkbox').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Consulta productos').length).toBeGreaterThan(0);
  });

  it('archivar una skill en uso (409) muestra «La usan N agentes»', async () => {
    patchOrgSkill.mockRejectedValueOnce(
      Object.assign(new Error('in use'), {
        status: 409,
        code: 'skill_in_use',
        meta: { agents: 3 },
      })
    );
    render(<SkillsPage />);
    await waitFor(() => expect(screen.queryAllByText('Archivar').length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText('Archivar')[0]);
    await waitFor(() => expect(screen.queryByText('La usan 3 agentes.')).not.toBeNull());
  });
});
