/**
 * Orden #48 · 0.1b (K1) — RED del rótulo honesto de «primera respuesta».
 *
 * El vínculo ejecución → mensaje saliente NO existe en el esquema: la regla es una
 * inferencia. La pantalla tiene que rotular el sexto paso y el dato histórico como
 * «primera respuesta (inferida)» y mostrar la regla literal junto a ellos.
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

const overview = {
  generatedAt: '2026-01-02T03:04:05.000Z',
  truncated: false,
  totalOrganizations: 1,
  totals: {
    organizations: 1,
    funnel: {
      registrada: 1,
      'sandbox listo': 1,
      'número conectado': 1,
      'agente creado': 1,
      'canal con agente': 1,
      'primera respuesta': 1,
    },
    duplicates: 0,
    legacyChannels: 0,
  },
  clients: [
    {
      organizationId: '28eff8cc-0000-4000-8000-000000000000',
      organizationName: 'Org K1',
      organizationCreatedAt: '2026-01-01T00:00:00.000Z',
      ownerEmail: 'd***@relt.dev',
      plan: 'trial',
      trialStartedAt: '2026-01-01T00:00:00.000Z',
      trialExpiresAt: '2026-02-01T00:00:00.000Z',
      sandbox: { status: 'ready', attempts: 1, lastErrorCode: null, instanceName: null },
      agents: { total: 1, active: 1 },
      numbers: [],
      activity: {
        firstInboundAt: '2026-01-01T10:00:00.000Z',
        lastInboundAt: '2026-01-01T10:05:00.000Z',
        inbound7d: 3,
        executions7d: 3,
        executionsFailed7d: 0,
        inboxFailed: 0,
        inboxReceivedOver1h: 0,
      },
      steps: {
        registrada: true,
        'sandbox listo': true,
        'número conectado': true,
        'agente creado': true,
        'canal con agente': true,
        'primera respuesta': true,
      },
      lastStep: 'primera respuesta',
      firstReplyAt: '2026-01-01T10:20:00.000Z',
    },
  ],
};

beforeEach(() => {
  mocks.getPlatformClients.mockReset();
});

describe('0.1b (K1) · el sexto paso es una inferencia', () => {
  it('T48-K1 · el rótulo dice «primera respuesta (inferida)» y muestra la regla literal', async () => {
    mocks.getPlatformClients.mockResolvedValue(overview);

    render(<PlatformClientsPage />);

    await waitFor(() => {
      expect(screen.getByText('Organizations')).toBeTruthy();
    });

    // El sexto paso (funnel y/o fila) se rotula como inferencia.
    expect(screen.getAllByText(/primera respuesta \(inferida\)/i).length).toBeGreaterThan(0);

    // El dato histórico también se rotula como inferencia.
    expect(screen.getAllByText(/primera respuesta \(inferida\)/i).length).toBeGreaterThan(1);

    // La regla literal está visible en algún sitio.
    expect(
      screen.getByText((content) =>
        content.includes('dentro de 1 h; puede no ser la respuesta del Agent'),
      ),
    ).toBeTruthy();
  });
});