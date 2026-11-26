import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

/**
 * T65-14 (ORDEN-65 · Bloque 2 · ANEXO-65-B · A-5) — cambiar de idioma mientras se edita.
 *
 * Criterios (lección P1 de la #64): el idioma nuevo cambia las etiquetas pero NO
 * cambia el texto escrito ni vuelve a pedir el `GET`.
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
import { getMessages } from '@/i18n/catalog';
import { I18nProvider } from '@/i18n/provider';
import type { Locale } from '@/i18n/types';

function Harness() {
  const [locale, setLocale] = useState<Locale>('es');
  return (
    <I18nProvider locale={locale} messages={getMessages(locale)}>
      <button type="button" onClick={() => setLocale('en')}>
        cambiar-idioma
      </button>
      <BusinessInstructionsPage />
    </I18nProvider>
  );
}

describe('T65-14 · el cambio de idioma no recarga ni pisa el texto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBusinessInstructions.mockReset();
  });
  afterEach(() => cleanup());

  it('cambia las etiquetas y conserva lo escrito, con un solo GET', async () => {
    getBusinessInstructions.mockResolvedValue({
      content: 'Texto original',
      revision: 5,
      updated_at: null,
      max_length: 8000,
      can_edit: true,
    });

    render(<Harness />);
    await waitFor(() =>
      expect(screen.queryByLabelText('Instrucciones del negocio')).not.toBeNull(),
    );
    const ta = screen.queryByLabelText('Instrucciones del negocio') as HTMLTextAreaElement | null;
    expect(ta).not.toBeNull();
    fireEvent.change(ta as HTMLTextAreaElement, { target: { value: 'Texto editado' } });
    expect(getBusinessInstructions).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'cambiar-idioma' }));

    await waitFor(() =>
      expect(screen.queryByLabelText('Business instructions')).not.toBeNull(),
    );
    const taEn = screen.queryByLabelText('Business instructions') as HTMLTextAreaElement | null;
    expect(taEn).not.toBeNull();
    expect((taEn as HTMLTextAreaElement).value).toBe('Texto editado');
    expect(screen.queryByText('13/8000')).not.toBeNull();
    expect(getBusinessInstructions).toHaveBeenCalledTimes(1);
  });
});
