/**
 * Orden #47 v2 · C1 (RED) — la página del panel no muestra nada a quien no es admin.
 *
 * Un usuario que no es administrador y entra directo por URL a
 * /dashboard/platform/clients tiene que ver "Not authorized" y ningún dato.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  getPlatformClients: vi.fn(),
}));

vi.mock('@/lib/platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/platform')>();
  return { ...actual, getPlatformClients: mocks.getPlatformClients };
});

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({}),
}));

import PlatformClientsPage from '@/app/dashboard/platform/clients/page';

beforeEach(() => {
  mocks.getPlatformClients.mockReset();
});

describe('C1 · panel interno: usuario que no es administrador', () => {
  it('T31 · entrando por URL directa ve "Not authorized" y ningún dato', async () => {
    const err = Object.assign(new Error('Forbidden'), { status: 403 });
    mocks.getPlatformClients.mockRejectedValue(err);

    render(<PlatformClientsPage />);

    await waitFor(() => {
      expect(screen.getByText('Not authorized')).toBeTruthy();
    });

    // Ningún dato del panel en pantalla.
    expect(screen.queryByText('P47 Demo Duplicado')).toBeNull();
    expect(screen.queryByText('dueno@relt.dev')).toBeNull();
    expect(screen.queryByText(/\\*\\*\\*2233/)).toBeNull();
    expect(screen.queryByText('Onboarding funnel')).toBeNull();
    expect(screen.queryByText('Organizations')).toBeNull();
  });
});
