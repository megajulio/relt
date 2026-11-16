/**
 * Orden #49 · Bloque 3 · C3 — rótulo de D5.
 *
 * «This number has no agent assigned: new conversations get the generic reply.»
 * (literal de G3 de la Orden #51) con la acción directa de asignarlo, en las tres
 * superficies: sandbox, Channels y detalle del Agent.
 *
 * La #49 pedía «Este número no tiene un agente asignado: responde el flujo genérico.»;
 * G3 de la Orden #51 (D-50.4) lo corrige porque el worker resuelve el Agent por
 * `conversations.agent_id`: lo genérico lo reciben las conversaciones NUEVAS y las
 * existentes conservan su Agent. Las expectativas de comportamiento (tres superficies
 * + acción de asignar) no cambian.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  assignChannel: vi.fn(),
  getAgent: vi.fn(),
  listPhoneNumbers: vi.fn(),
  unassignChannel: vi.fn(),
}));

vi.mock('@/lib/agents', () => ({
  assignChannel: mocks.assignChannel,
  getAgent: mocks.getAgent,
  listPhoneNumbers: mocks.listPhoneNumbers,
  unassignChannel: mocks.unassignChannel,
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
import SandboxPage from '@/app/dashboard/sandbox/page';

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
  mocks.unassignChannel.mockReset();
  unassignedState.current = { channels: [], singleActiveAgent: null };
});

describe('C3 · D5 — canal conectado sin agente', () => {
  it('T49-C3-D5-1 · el texto visible es el inglés exacto y la acción asigna al Agent', async () => {
    const onAssigned = vi.fn();
    render(
      <ChannelWithoutAgentNotice channel={channel} agentId="agent-1" onAssigned={onAssigned} />,
    );

    // H3-2: el texto visible va en el idioma del dashboard, igual que D2.
    // G3 (#51): fiel al enrutamiento — lo genérico lo reciben las conversaciones NUEVAS.
    expect(D5_NO_AGENT_TEXT).toBe(
      'This number has no agent assigned: new conversations get the generic reply.',
    );
    // El literal español de la orden se conserva (no se borra ni se parafrasea).
    expect(D5_NO_AGENT_TEXT_ORDER_LITERAL).toBe(
      'Este número no tiene un agente asignado: las conversaciones nuevas reciben la respuesta genérica.',
    );
    expect(screen.getByText(D5_NO_AGENT_TEXT)).toBeTruthy();
    expect(screen.queryByText(D5_NO_AGENT_TEXT_ORDER_LITERAL)).toBeNull();
    expect(screen.getByText(channel.phoneNumber)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /assign to this agent/i }));

    await waitFor(() => {
      expect(mocks.assignChannel).toHaveBeenCalledWith('agent-1', 'pn-1', true);
      expect(onAssigned).toHaveBeenCalledTimes(1);
    });
  });

  it('T49-C3-D5-2 · sin Agent inequívoco no asigna a ciegas: lleva a elegir Agent', () => {
    render(<ChannelWithoutAgentNotice channel={channel} agentId={null} />);

    expect(screen.getByText(D5_NO_AGENT_TEXT)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /assign to this agent/i })).toBeNull();
    expect(screen.getByRole('link', { name: /choose an agent/i }).getAttribute('href')).toBe(
      '/dashboard/agents',
    );
    expect(mocks.assignChannel).not.toHaveBeenCalled();
  });

  it('T49-C3-D5-3 · en Channels aparece el aviso con la acción de asignar', async () => {
    render(
      <AgentChannelsForm
        agent={agent}
        onSaved={vi.fn()}
        unassignedChannels={[{ id: 'pn-1', phoneNumber: channel.phoneNumber, provider: 'EVOLUTION' }]}
      />,
    );

    expect(screen.getByTestId('d5-notice-channels')).toBeTruthy();
    expect(screen.getByText(D5_NO_AGENT_TEXT)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /assign to this agent/i }));

    await waitFor(() => {
      expect(mocks.assignChannel).toHaveBeenCalledWith('agent-1', 'pn-1', true);
    });
  });

  it('T49-C3-D5-4 · el sandbox muestra el aviso con su acción', () => {
    unassignedState.current = {
      channels: [{ id: 'pn-1', phoneNumber: channel.phoneNumber, provider: 'EVOLUTION' }],
      singleActiveAgent: { id: 'agent-1', name: 'Agent One' },
    };

    render(<SandboxPage />);

    expect(screen.getByTestId('d5-notice-sandbox')).toBeTruthy();
    expect(screen.getByText(D5_NO_AGENT_TEXT)).toBeTruthy();
  });
});
