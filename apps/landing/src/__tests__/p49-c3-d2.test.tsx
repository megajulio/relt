/**
 * Orden #49 · Bloque 3 · C3 — rótulo de D2.
 *
 * El sandbox de la organización rechazada muestra un estado claro con el texto exacto
 * (en el idioma del dashboard, como pide la orden v2). El backend marca la fila del
 * sandbox con `status='failed'` y `last_error_code='channel_number_conflict'`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
const statusState = vi.hoisted(() => ({
  current: null as { status: string; last_error_code: string; last_error: string } | null,
}));

vi.mock('@/lib/use-sandbox-status', () => ({
  useSandboxStatus: () => ({
    data: statusState.current,
    loading: false,
    error: null,
    retrying: false,
    retry: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/use-sandbox-qr', () => ({
  useSandboxQR: () => ({
    data: { status: 'no_qr_available' },
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/use-sandbox-connection', () => ({
  useSandboxConnection: () => ({
    data: { state: 'disconnected', instance_name: 'inst-1', provider: 'EVOLUTION' },
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/use-unassigned-channels', () => ({
  useUnassignedChannels: () => ({
    channels: [],
    singleActiveAgent: null,
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({
    data: { user: { name: 'T' }, organizations: [{ id: 'org-1', name: 'Org' }], logout: vi.fn() },
  }),
}));

import { D2_CONFLICT_TEXT, D2_CONFLICT_TEXT_ORDER_LITERAL } from '@/lib/orden49';
import { SandboxStatusCard } from '@/components/dashboard/SandboxStatusCard';
import SandboxPage from '@/app/dashboard/sandbox/page';
import { renderWithI18n } from './render-with-i18n';

const render = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, 'en');

const conflict = {
  status: 'failed',
  last_error_code: 'channel_number_conflict',
  last_error: D2_CONFLICT_TEXT_ORDER_LITERAL,
};

beforeEach(() => {
  statusState.current = null;
});

describe('C3 · D2 — estado visible del sandbox rechazado', () => {
  it('T49-C3-D2-1 · la tarjeta muestra el texto exacto y no ofrece reintentar', () => {
    statusState.current = conflict;

    render(<SandboxStatusCard orgId="org-1" />);

    expect(screen.getByTestId('d2-sandbox-status')).toBeTruthy();
    expect(screen.getByText(D2_CONFLICT_TEXT)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /retry setup/i })).toBeNull();
  });

  it('T49-C3-D2-2 · la pantalla del sandbox muestra el estado claro y no otros estados', () => {
    statusState.current = conflict;

    render(<SandboxPage />);

    expect(screen.getByTestId('d2-sandbox-conflict')).toBeTruthy();
    expect(screen.getByText(D2_CONFLICT_TEXT)).toBeTruthy();
    expect(screen.queryByText(/WhatsApp is disconnected/i)).toBeNull();
  });

  it('T49-C3-D2-3 · otro fallo del sandbox NO se rotula como conflicto de número', () => {
    statusState.current = {
      status: 'failed',
      last_error_code: 'EVOLUTION_TIMEOUT',
      last_error: 'timeout',
    };

    render(<SandboxStatusCard orgId="org-1" />);

    expect(screen.queryByTestId('d2-sandbox-status')).toBeNull();
    expect(screen.queryByText(D2_CONFLICT_TEXT)).toBeNull();
    expect(screen.getByText(/setup failed/i)).toBeTruthy();
  });
});
