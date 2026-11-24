/**
 * Orden #49 · Bloque 3 · C3 — rótulo de «primera respuesta» con el vínculo (E2).
 *
 * Cuando `firstReplySource === 'link'` el dato NO es una inferencia: el rótulo pierde
 * «(inferida)». El histórico sin vínculo conserva «(inferida)», como en la #48 (K1).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ getPlatformClients: vi.fn() }));

vi.mock('@/lib/platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/platform')>();
  return { ...actual, getPlatformClients: mocks.getPlatformClients };
});

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({}),
}));

import PlatformClientsPage from '@/app/dashboard/platform/clients/page';
import { renderWithI18n } from './render-with-i18n';

const render = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, 'es');

function client(overrides: Record<string, unknown>) {
  return {
    organizationId: 'org-x',
    organizationName: 'Org X',
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
    firstReplySource: 'link',
    ...overrides,
  };
}

const overview = {
  generatedAt: '2026-01-02T03:04:05.000Z',
  truncated: false,
  totalOrganizations: 2,
  totals: {
    organizations: 2,
    funnel: {
      registrada: 2,
      'sandbox listo': 2,
      'número conectado': 2,
      'agente creado': 2,
      'canal con agente': 2,
      'primera respuesta': 2,
    },
    duplicates: 0,
    legacyChannels: 0,
  },
  clients: [
    client({
      organizationId: 'org-link',
      organizationName: 'Org Vinculo',
      firstReplySource: 'link',
    }),
    client({
      organizationId: 'org-inferida',
      organizationName: 'Org Inferida',
      firstReplySource: 'inferred',
    }),
  ],
};

beforeEach(() => {
  mocks.getPlatformClients.mockReset().mockResolvedValue(overview);
});

describe('C3 · primera respuesta por vínculo', () => {
  it('T49-C3-E2-1 · con vínculo el rótulo es «primera respuesta», sin «(inferida)»', async () => {
    render(<PlatformClientsPage />);

    await waitFor(() => {
      expect(screen.getByText('Organizaciones')).toBeTruthy();
    });

    const linkRow = screen.getByTestId('client-row-org-link');
    const linkDatum = within(linkRow).getByTestId('first-reply-datum');
    expect(linkDatum.textContent?.startsWith('Primera respuesta:')).toBe(true);
    expect(linkDatum.textContent).not.toContain('(inferida)');

    // En toda la fila (badge del último paso incluido) no aparece «(inferida)».
    expect(within(linkRow).queryByText(/primera respuesta \(inferida\)/i)).toBeNull();

    // El badge dice exactamente «primera respuesta».
    expect(within(linkRow).getByText('Primera respuesta')).toBeTruthy();
  });

  it('T49-C3-E2-2 · el histórico sin vínculo conserva «(inferida)»', async () => {
    render(<PlatformClientsPage />);

    await waitFor(() => {
      expect(screen.getByText('Organizaciones')).toBeTruthy();
    });

    const inferredRow = screen.getByTestId('client-row-org-inferida');
    const inferredDatum = within(inferredRow).getByTestId('first-reply-datum');
    expect(inferredDatum.textContent?.startsWith('Primera respuesta (inferida):')).toBe(true);

    // La regla de la inferencia sigue visible (K1 no se pierde).
    expect(
      screen.getByText((content) =>
        content.includes('dentro de 1 h; puede no ser la respuesta del Agent'),
      ),
    ).toBeTruthy();
  });
});
