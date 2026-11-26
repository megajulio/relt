import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';

/**
 * T65-11 (ORDEN-65 · Bloque 2 · ANEXO-65-B · A-5) — página de las Instrucciones del negocio.
 *
 * Criterios: carga con el contador `n/8000` (`countChars`); guardar manda
 * `expected_revision` y usa la revisión de la RESPUESTA (dos guardados seguidos no
 * dan 409); «Usar plantilla» completa SIN guardar; el aviso de corchetes aparece.
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

const VIEW = {
  content: 'Hola',
  revision: 3,
  updated_at: null,
  max_length: 8000,
  can_edit: true,
};

async function renderReady(): Promise<HTMLTextAreaElement | null> {
  getBusinessInstructions.mockResolvedValue(VIEW);
  renderWithI18n(<BusinessInstructionsPage />, 'es');
  await waitFor(() =>
    expect(screen.queryByLabelText('Instrucciones del negocio')).not.toBeNull(),
  );
  return screen.queryByLabelText('Instrucciones del negocio') as HTMLTextAreaElement | null;
}

describe('T65-11 · Instrucciones del negocio: cargar, guardar, contador y plantilla', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBusinessInstructions.mockReset();
    putBusinessInstructions.mockReset();
  });
  afterEach(() => cleanup());

  it('carga el texto y el contador n/8000', async () => {
    const ta = await renderReady();
    expect(ta).not.toBeNull();
    expect((ta as HTMLTextAreaElement).value).toBe('Hola');
    expect(screen.queryByText('4/8000')).not.toBeNull();
    expect(
      screen.queryByText('Valen para todos tus agentes, desde el próximo mensaje.'),
    ).not.toBeNull();
  });

  it('el contador cuenta code points (emoji = 1)', async () => {
    const ta = await renderReady();
    expect(ta).not.toBeNull();
    fireEvent.change(ta as HTMLTextAreaElement, { target: { value: '😀😀' } });
    expect(screen.queryByText('2/8000')).not.toBeNull();
  });

  it('guarda con expected_revision y usa la revisión de la respuesta', async () => {
    const ta = await renderReady();
    expect(ta).not.toBeNull();
    putBusinessInstructions.mockResolvedValueOnce({ ...VIEW, content: 'Uno', revision: 4 });

    fireEvent.change(ta as HTMLTextAreaElement, { target: { value: 'Uno' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(putBusinessInstructions).toHaveBeenCalledWith('Uno', 3));
    expect(screen.queryByText('Guardadas. Valen desde el próximo mensaje.')).not.toBeNull();

    putBusinessInstructions.mockResolvedValueOnce({ ...VIEW, content: 'Dos', revision: 5 });
    fireEvent.change(screen.getByLabelText('Instrucciones del negocio'), {
      target: { value: 'Dos' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(putBusinessInstructions).toHaveBeenCalledWith('Dos', 4));
    expect(putBusinessInstructions).toHaveBeenCalledTimes(2);
  });

  it('«Usar plantilla» completa sin guardar y avisa de los corchetes', async () => {
    getBusinessInstructions.mockResolvedValue({ ...VIEW, content: '', revision: 0 });
    renderWithI18n(<BusinessInstructionsPage />, 'es');
    await waitFor(() =>
      expect(screen.queryByLabelText('Instrucciones del negocio')).not.toBeNull(),
    );
    const ta = screen.queryByLabelText('Instrucciones del negocio') as HTMLTextAreaElement | null;
    expect(ta).not.toBeNull();
    expect((ta as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByText('0/8000')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Usar plantilla' }));
    expect(
      (screen.queryByLabelText('Instrucciones del negocio') as HTMLTextAreaElement).value,
    ).toContain('Somos [nombre del negocio]');
    expect(screen.queryByText('Completa los datos entre corchetes')).not.toBeNull();
    expect(putBusinessInstructions).not.toHaveBeenCalled();
  });
});
