import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={typeof href === 'string' ? href : '#'}>{children}</a>
  ),
}));
vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({}),
}));
vi.mock('@/lib/skills', () => ({
  listSkills: vi.fn().mockResolvedValue([
    { name: 'general', latestVersion: '1.0.0', description: '', toolsCount: 0, permissions: [], triggers: [] },
    { name: 'sales-assistant', latestVersion: '1.0.0', description: '', toolsCount: 0, permissions: [], triggers: [] },
  ]),
}));

import CreateAgentPage from '@/app/dashboard/agents/new/page';

/**
 * U1 · La página de creación vuelve a exponer los 3 controles de modelo
 * (habilitados) y conserva el selector de Skill.
 */
describe('U1 · create page · campos de modelo rehabilitados', () => {
  it('habilita los controles de modelo y mantiene el selector de Skill', async () => {
    render(<CreateAgentPage />);

    // Selector de Skill presente (skill cargado de forma asíncrona)
    const salesOption = await screen.findByRole('option', { name: 'sales-assistant' });
    const skillSelect = salesOption.closest('select') as HTMLSelectElement;
    expect(skillSelect).not.toBeNull();
    expect(skillSelect.value).toBe('general');

    // Controles de modelo habilitados
    const strategyOption = screen.getByRole('option', { name: /dual/i });
    const strategy = strategyOption.closest('select') as HTMLSelectElement;
    expect(strategy.disabled).toBe(false);

    const reasoning = screen.getByPlaceholderText('gpt-4o') as HTMLInputElement;
    expect(reasoning.disabled).toBe(false);

    const response = screen.getByPlaceholderText('gpt-4o-mini') as HTMLInputElement;
    expect(response.disabled).toBe(false);
  });
});
