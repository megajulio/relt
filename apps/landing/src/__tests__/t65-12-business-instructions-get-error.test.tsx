import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';

/**
 * T65-12 (ORDEN-65 · Bloque 2 · ANEXO-65-B · A-5) — el `GET` falla.
 *
 * Criterios: sin editor y sin «Guardar» (nunca se guarda sobre algo que no se
 * cargó); un mensaje y «Reintentar»; al reintentar con éxito aparece el editor.
 */

const getBusinessInstructions = vi.fn();

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({}),
}));
vi.mock('@/lib/business-instructions', () => ({
  getBusinessInstructions: () => getBusinessInstructions(),
  putBusinessInstructions: vi.fn(),
}));

import BusinessInstructionsPage from '@/app/dashboard/business-instructions/page';
import { renderWithI18n } from './render-with-i18n';

describe('T65-12 · si el GET falla no hay editor ni Guardar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBusinessInstructions.mockReset();
  });
  afterEach(() => cleanup());

  it('muestra el mensaje y Reintentar, sin editor ni Guardar; el reintento carga', async () => {
    getBusinessInstructions.mockRejectedValueOnce(new Error('boom'));
    getBusinessInstructions.mockResolvedValueOnce({
      content: 'Guardado',
      revision: 7,
      updated_at: null,
      max_length: 8000,
      can_edit: true,
    });

    renderWithI18n(<BusinessInstructionsPage />, 'es');

    await waitFor(() =>
      expect(
        screen.getByText('No se pudieron cargar las Instrucciones del negocio.'),
      ).not.toBeNull(),
    );
    expect(screen.queryByLabelText('Instrucciones del negocio')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Usar plantilla' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() =>
      expect(screen.queryByLabelText('Instrucciones del negocio')).not.toBeNull(),
    );
    const ta = screen.queryByLabelText('Instrucciones del negocio') as HTMLTextAreaElement | null;
    expect(ta).not.toBeNull();
    expect((ta as HTMLTextAreaElement).value).toBe('Guardado');
    expect(screen.queryByText('8/8000')).not.toBeNull();
    expect(getBusinessInstructions).toHaveBeenCalledTimes(2);
  });
});
