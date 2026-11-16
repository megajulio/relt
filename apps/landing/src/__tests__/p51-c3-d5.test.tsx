/**
 * Orden #51 · Bloque 2 · C3 — G3: aviso D5 fiel al enrutamiento (D-50.4).
 *
 * El aviso pasa a decir lo que de verdad ocurre: el canal no tiene Agent, así que las
 * conversaciones NUEVAS reciben la respuesta genérica (las existentes conservan el suyo,
 * porque el worker resuelve por `conversations.agent_id`).
 *
 * Se fija el LITERAL EXACTO de G3 en las tres superficies — sandbox, pestaña Channels del
 * Agent y detalle del Agent — y que la acción de asignar sigue igual: un clic sobre el
 * canal sin Agent llama a `assignChannel(agentId, channelId, true)` y refresca.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  assignChannel: vi.fn(),
  getAgent: vi.fn(),
  listPhoneNumbers: vi.fn(),
  unassignChannel: vi.fn(),
  updateAgentStatus: vi.fn(),
}));

vi.mock('@/lib/agents', () => ({
  assignChannel: mocks.assignChannel,
  getAgent: mocks.getAgent,
  listPhoneNumbers: mocks.listPhoneNumbers,
  unassignChannel: mocks.unassignChannel,
  updateAgentStatus: mocks.updateAgentStatus,
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'agent-1' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({
    data: { user: { name: 'T' }, organizations: [{ id: 'org-1', name: 'Org' }], logout: vi.fn() },
  }),
}));

vi.mock('@/lib/use-sandbox-status', () => ({
  useSandboxStatus: () => ({
    data: null,
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

const unassignedState = vi.hoisted(() => ({
  current: {
    channels: [] as Array<{ id: string; phoneNumber: string; provider: string | null }>,
    singleActiveAgent: null as { id: string; name: string } | null,
  },
}));

vi.mock('@/lib/use-unassigned-channels', () => ({
  useUnassignedChannels: () => ({
    channels: unassignedState.current.channels,
    singleActiveAgent: unassignedState.current.singleActiveAgent,
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

import { D5_NO_AGENT_TEXT, D5_NO_AGENT_TEXT_ORDER_LITERAL } from '@/lib/orden49';
import { ChannelWithoutAgentNotice } from '@/components/dashboard/ChannelWithoutAgentNotice';
import AgentChannelsForm from '@/components/agent-channels-form';
import AgentDetailPage from '@/app/dashboard/agents/[id]/page';
import SandboxPage from '@/app/dashboard/sandbox/page';

/** G3 · literal visible exacto (el dashboard del cliente está en inglés). */
const D5_TEXT_G3 =
  'This number has no agent assigned: new conversations get the generic reply.';

/** G3 · literal de referencia en español (constante de test, como en la #49). */
const D5_TEXT_G3_ORDER =
  'Este número no tiene un agente asignado: las conversaciones nuevas reciben la respuesta genérica.';

/** Texto de la #49, que G3 sustituye: no debe aparecer en ninguna superficie. */
const D5_TEXT_49 = /the generic flow is replying/i;

const agent = {
  id: 'agent-1',
  organizationId: 'org-1',
  key: 'agent-key',
  name: 'Agent One',
  status: 'active' as const,
  defaultSkill: 'sales-assistant',
  config: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  bindings: [],
};

const channel = { id: 'pn-1', phoneNumber: '+1 555 000 1111', provider: 'EVOLUTION' };

beforeEach(() => {
  mocks.assignChannel.mockReset().mockResolvedValue(undefined);
  mocks.getAgent.mockReset().mockResolvedValue(agent);
  mocks.listPhoneNumbers.mockReset().mockResolvedValue([]);
  mocks.unassignChannel.mockReset().mockResolvedValue(undefined);
  mocks.updateAgentStatus.mockReset();
  unassignedState.current = { channels: [], singleActiveAgent: null };
});

describe('C3 · G3 — aviso D5 fiel al enrutamiento', () => {
  it('T51-C3-D5-1 · el literal de G3 es el exacto (inglés visible y español de referencia)', () => {
    expect(D5_NO_AGENT_TEXT).toBe(D5_TEXT_G3);
    expect(D5_NO_AGENT_TEXT_ORDER_LITERAL).toBe(D5_TEXT_G3_ORDER);
  });

  it('T51-C3-D5-2 · sandbox: muestra el literal de G3 y ya no el de la #49', () => {
    unassignedState.current = {
      channels: [{ id: 'pn-1', phoneNumber: channel.phoneNumber, provider: 'EVOLUTION' }],
      singleActiveAgent: { id: 'agent-1', name: 'Agent One' },
    };

    render(<SandboxPage />);

    expect(screen.getByTestId('d5-notice-sandbox')).toBeTruthy();
    expect(screen.getByText(D5_TEXT_G3)).toBeTruthy();
    expect(screen.queryByText(D5_TEXT_49)).toBeNull();
  });

  it('T51-C3-D5-3 · pestaña Channels: literal de G3 y la acción de asignar sigue igual', async () => {
    render(
      <AgentChannelsForm
        agent={agent}
        onSaved={vi.fn()}
        unassignedChannels={[
          { id: 'pn-1', phoneNumber: channel.phoneNumber, provider: 'EVOLUTION' },
        ]}
      />,
    );

    expect(screen.getByTestId('d5-notice-channels')).toBeTruthy();
    expect(screen.getByText(D5_TEXT_G3)).toBeTruthy();
    expect(screen.queryByText(D5_TEXT_49)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /assign to this agent/i }));

    await waitFor(() => {
      expect(mocks.assignChannel).toHaveBeenCalledWith('agent-1', 'pn-1', true);
    });
  });

  it('T51-C3-D5-4 · detalle del Agent: literal de G3 y asignar en un clic (sin cambios)', async () => {
    unassignedState.current = {
      channels: [{ id: 'pn-1', phoneNumber: channel.phoneNumber, provider: 'EVOLUTION' }],
      singleActiveAgent: { id: 'agent-1', name: 'Agent One' },
    };

    render(<AgentDetailPage />);

    const notice = await screen.findByTestId('d5-notice-agent-detail');
    expect(notice.textContent).toContain(D5_TEXT_G3);
    expect(screen.queryByText(D5_TEXT_49)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /assign to this agent/i }));

    await waitFor(() => {
      expect(mocks.assignChannel).toHaveBeenCalledWith('agent-1', 'pn-1', true);
    });
  });

  it('T51-C3-D5-5 · sin Agent inequívoco, el aviso es igual y la acción lleva a elegir Agent', () => {
    render(<ChannelWithoutAgentNotice channel={channel} agentId={null} />);

    expect(screen.getByText(D5_TEXT_G3)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /assign to this agent/i })).toBeNull();
    expect(screen.getByRole('link', { name: /choose an agent/i }).getAttribute('href')).toBe(
      '/dashboard/agents',
    );
    expect(mocks.assignChannel).not.toHaveBeenCalled();
  });
});