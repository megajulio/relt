import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
/**
 * T57-14 (Orden #57 · Bloque 3 · ANEXO-57-G) — alta del agente.
 * Criterios (Bloque 3): el selector de skill está precargado con `general` e incluye las
 * skills de la org; cada opción muestra sus capacidades derivadas de sus tools (G-4.1); la
 * plantilla de D4 viene precargada.
 */

const SKILLS = [
  { name: 'general', latest_version: '1.0.0', description: 'General', tools_count: 1, permissions: ['products:read'], triggers: [], kind: 'repo', tools: ['products.search'] },
  { name: 'sales-assistant', latest_version: '1.1.1', description: 'Ventas', tools_count: 3, permissions: ['products:read', 'quotes:create'], triggers: [], kind: 'repo', tools: ['products.search', 'quotes.create', 'customers.lookup'] },
  { name: 'mi-tienda', latest_version: '1', description: 'De la org', tools_count: 1, permissions: ['products:read'], triggers: [], kind: 'org', display_name: 'Mi Tienda', base_skill: 'general', allowed_tools: ['products.search'], tools: ['products.search'] },
];

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({}),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/lib/agents', () => ({
  createAgent: vi.fn(),
}));
vi.mock('@/lib/skills', () => ({
  listSkillsWithTools: vi.fn(async () => SKILLS),
  listSkills: vi.fn(async () => SKILLS),
  getSkill: vi.fn(),
  createOrgSkill: vi.fn(),
  patchOrgSkill: vi.fn(),
}));

import CreateAgentPage from '@/app/dashboard/agents/new/page';
import { renderWithI18n } from './render-with-i18n';

const render = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, 'es');

describe('T57-14 · alta: selector de skill (D5) e Instrucciones del negocio (D4)', () => {
  afterEach(() => cleanup());

  it('precarga general, incluye la skill de la org y muestra capacidades y plantilla', async () => {
    render(<CreateAgentPage />);

    await waitFor(() => {
      const select = screen.queryByRole('combobox', { name: 'Skill por defecto' }) as HTMLSelectElement | null;
      expect(select).not.toBeNull();
      const values = Array.from((select as HTMLSelectElement).options).map((o) => o.value);
      expect(values).toContain('general');
      expect(values).toContain('mi-tienda');
    });

    const select = screen.getByRole('combobox', { name: 'Skill por defecto' }) as HTMLSelectElement;
    expect(select.value).toBe('general');

    const generalOption = Array.from(select.options).find((o) => o.value === 'general');
    expect(generalOption?.textContent).toContain('Consulta productos');

    const textarea = screen.getByLabelText('Instrucciones del negocio') as HTMLTextAreaElement;
    expect(textarea.value).toContain('Somos [nombre del negocio]');
  });
});
