import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';

/**
 * T65-16 (ORDEN-65 · Bloque 2 · ANEXO-65-B · N6/A-6) — pantalla de Tools (solo lectura).
 *
 * Criterios: la frase del mapa único de D5 (o la de reserva con el nombre técnico),
 * el nombre técnico, «Consulta»/«Modifica datos», «Permitida»/«No permitida»,
 * «La usan: …»/«Ninguna skill la usa», la marca de skill bloqueada, la aclaración
 * y NINGÚN control para editar.
 */

const getToolsOverview = vi.fn();

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({}),
}));
vi.mock('@/lib/tools', () => ({
  getToolsOverview: () => getToolsOverview(),
}));

import ToolsPage from '@/app/dashboard/tools/page';
import { renderWithI18n } from './render-with-i18n';

const TOOLS = [
  {
    name: 'customers.lookup',
    access: 'read' as const,
    required_permissions: ['customers:read'],
    allowed: true,
    missing_permissions: [],
    skills: [
      { name: 'general', display_name: 'General', kind: 'repo' as const, permitted: true },
      { name: 'ventas', display_name: 'Ventas', kind: 'org' as const, permitted: false },
    ],
  },
  {
    name: 'x.unknown',
    access: 'write' as const,
    required_permissions: ['x:write'],
    allowed: false,
    missing_permissions: ['x:write'],
    skills: [],
  },
];

describe('T65-16 · pantalla de Tools, solo lectura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getToolsOverview.mockReset();
  });
  afterEach(() => cleanup());

  it('pinta los estados, las frases y las skills que la usan, sin controles', async () => {
    getToolsOverview.mockResolvedValue(TOOLS);
    renderWithI18n(<ToolsPage />, 'es');

    await waitFor(() => expect(document.querySelectorAll('[data-testid="tool-row"]').length).toBe(2));

    // Frase del mapa existente (D5) y nombre técnico.
    expect(screen.queryByText('Busca datos de clientes')).not.toBeNull();
    expect(screen.queryByText('customers.lookup')).not.toBeNull();
    expect(screen.queryByText('Consulta')).not.toBeNull();
    expect(screen.queryByText('Permitida')).not.toBeNull();

    // Skill bloqueada por permisos del negocio.
    expect(
      screen.queryByText('La usan: General, Ventas (bloqueada: a tu negocio le falta un permiso)'),
    ).not.toBeNull();

    // Si falta la frase, la de reserva con el nombre técnico; tool de escritura y sin skills.
    expect(screen.queryByText('Otra capacidad (x.unknown)')).not.toBeNull();
    expect(screen.queryByText('Modifica datos')).not.toBeNull();
    expect(screen.queryByText('No permitida')).not.toBeNull();
    expect(screen.queryByText('Ninguna skill la usa')).not.toBeNull();

    // La aclaración de la pantalla.
    expect(
      screen.queryByText(
        'Permitida no quiere decir que todos los agentes la usen: depende de su skill.',
      ),
    ).not.toBeNull();

    // Sin ningún control para editar.
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });

  it('si la lectura falla: mensaje y Reintentar, sin filas', async () => {
    getToolsOverview.mockRejectedValueOnce(new Error('boom'));
    getToolsOverview.mockResolvedValueOnce(TOOLS);
    renderWithI18n(<ToolsPage />, 'es');

    await waitFor(() =>
      expect(screen.queryByText('No se pudieron cargar las tools.')).not.toBeNull(),
    );
    expect(document.querySelectorAll('[data-testid="tool-row"]').length).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(document.querySelectorAll('[data-testid="tool-row"]').length).toBe(2));
  });
});
