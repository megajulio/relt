import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';

/**
 * T65-13 (ORDEN-65 · Bloque 2 · ANEXO-65-B · A-5) — el `PUT` responde 409.
 *
 * Criterios: no se pierde lo escrito; NO se reintenta solo; un aviso claro ofrece
 * cargar la versión guardada (acción explícita del usuario).
 */

const getBusinessInstructions = vi.fn();
const putBusinessInstructions = vi.fn();

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({}),
}));
vi.mock('@/lib/business-instructions', () => ({
  getBusinessInstructions: () => getBusinessInstructions(),
  putBusinessInstructions: (content: string, revision: number) =>
    putBusinessInstructions(content, revision),
}));

import BusinessInstructionsPage from '@/app/dashboard/business-instructions/page';
import { renderWithI18n } from './render-with-i18n';

const CONFLICT = 'Otra persona guardó estas instrucciones antes. Lo que escribiste sigue aquí y no se guardó. No se reintenta solo: carga la versión guardada para revisarla.';

describe('T65-13 · el 409 conserva lo escrito y no reintenta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBusinessInstructions.mockReset();
    putBusinessInstructions.mockReset();
  });
  afterEach(() => cleanup());

  it('conserva el texto, avisa y espera: solo reintenta al pulsar', async () => {
    getBusinessInstructions.mockResolvedValue({
      content: 'Viejo',
      revision: 2,
      updated_at: null,
      max_length: 8000,
      can_edit: true,
    });
    putBusinessInstructions.mockRejectedValueOnce(
      Object.assign(new Error('conflict'), { status: 409 }),
    );

    renderWithI18n(<BusinessInstructionsPage />, 'es');
    await waitFor(() =>
      expect(screen.queryByLabelText('Instrucciones del negocio')).not.toBeNull(),
    );
    const ta = screen.queryByLabelText('Instrucciones del negocio') as HTMLTextAreaElement | null;
    expect(ta).not.toBeNull();
    fireEvent.change(ta as HTMLTextAreaElement, { target: { value: 'Lo que escribí' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(screen.getByText(CONFLICT)).not.toBeNull());
    expect((screen.getByLabelText('Instrucciones del negocio') as HTMLTextAreaElement).value).toBe(
      'Lo que escribí',
    );
    // Sin reintento automático: sigue siendo UNA sola llamada.
    expect(putBusinessInstructions).toHaveBeenCalledTimes(1);
    expect(putBusinessInstructions).toHaveBeenCalledWith('Lo que escribí', 2);

    // La acción explícita de cargar la versión guardada sí vuelve a leer.
    getBusinessInstructions.mockResolvedValue({
      content: 'Guardado por otra persona',
      revision: 3,
      updated_at: null,
      max_length: 8000,
      can_edit: true,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar la versión guardada' }));
    await waitFor(() =>
      expect((screen.getByLabelText('Instrucciones del negocio') as HTMLTextAreaElement).value).toBe(
        'Guardado por otra persona',
      ),
    );
    expect(putBusinessInstructions).toHaveBeenCalledTimes(1);
  });
});
