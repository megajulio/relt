import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';

/**
 * ORDEN-68 · Bloque 2 · T68-6 · ANEXO-68-A · A-6 y R3.
 *
 * Con un rol SIN permiso (`member`/`viewer`, que sale de `/auth/me`) el alta y
 * el detalle del agente quedan en SOLO LECTURA y con el aviso; con `owner` o
 * `admin`, como hoy. Lo que se oculta: «Nuevo agente», el alta entera (formulario
 * deshabilitado, sin «Crear»), «Guardar» en Configuration, Skills, Tools y
 * Memory, agregar y quitar canales, el control de estado y el botón de asignar
 * de `ChannelWithoutAgentNotice`.
 */

const state = vi.hoisted(() => ({ role: 'viewer' as string | null }));

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({
    data: {
      user: { id: 'u-1', email: 'u@example.invalid', name: 'User' },
      organizations: [{ id: 'org-1', name: 'Org', role: state.role }],
    },
    logout: async () => {},
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useParams: () => ({ id: 'agent-1' }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const agent = {
  id: 'agent-1',
  key: 'agent-uno',
  name: 'Agente Uno',
  status: 'active',
  defaultSkill: 'general',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  config: {
    maxSteps: 3,
    tone: 'neutral',
    systemPrompt: '',
    memory: { shortTerm: { enabled: true, limit: 10 }, summary: { enabled: false } },
    skillBinding: { skill: 'general' },
    toolBindings: [],
  },
  bindings: [
    {
      id: 'b-1',
      phoneNumberId: 'pn-1',
      phoneNumber: '+573000000001',
      status: 'active',
      isDefault: true,
    },
  ],
};

vi.mock('@/lib/agents', () => ({
  listAgents: vi.fn(async () => [agent]),
  getAgent: vi.fn(async () => agent),
  createAgent: vi.fn(),
  patchAgentConfig: vi.fn(async () => agent),
  updateAgentStatus: vi.fn(async () => agent),
  listPhoneNumbers: vi.fn(async () => []),
  assignChannel: vi.fn(),
  unassignChannel: vi.fn(),
  listTools: vi.fn(async () => []),
}));

vi.mock('@/lib/use-unassigned-channels', () => ({
  useUnassignedChannels: () => ({ channels: [], refresh: vi.fn() }),
}));

vi.mock('@/lib/skills', () => ({
  listSkills: vi.fn(async () => []),
  listSkillsWithTools: vi.fn(async () => []),
  listSkillVersions: vi.fn(async () => []),
  getSkill: vi.fn(),
  createOrgSkill: vi.fn(),
  patchOrgSkill: vi.fn(),
}));

vi.mock('@/lib/models', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/models')>();
  return { ...actual, listModels: vi.fn(async () => []) };
});

import AgentsPage from '@/app/dashboard/agents/page';
import CreateAgentPage from '@/app/dashboard/agents/new/page';
import AgentDetailPage from '@/app/dashboard/agents/[id]/page';
import { renderWithI18n } from './render-with-i18n';

const renderEs = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, 'es');

describe('T68-6 · el panel de agentes en solo lectura', () => {
  beforeEach(() => {
    state.role = 'viewer';
  });
  afterEach(() => cleanup());

  it('la lista: sin «Crear agente» y con el aviso (viewer); con dueño, como hoy', async () => {
    renderEs(<AgentsPage />);
    await waitFor(() => expect(screen.queryByText('Agente Uno')).not.toBeNull());

    expect(screen.queryByRole('link', { name: 'Crear agente' })).toBeNull();
    expect(screen.queryAllByTestId("agents-read-only").length).toBeGreaterThan(0);
    expect(
      screen.queryByText('Tu rol permite ver los agentes, no modificarlos.'),
    ).not.toBeNull();

    cleanup();
    state.role = 'owner';
    renderEs(<AgentsPage />);
    await waitFor(() => expect(screen.queryByText('Agente Uno')).not.toBeNull());
    expect(screen.queryByRole('link', { name: 'Crear agente' })).not.toBeNull();
    expect(screen.queryByTestId('agents-read-only')).toBeNull();
  });

  it('el alta: formulario deshabilitado y SIN «Crear» (member)', async () => {
    state.role = 'member';
    renderEs(<CreateAgentPage />);
    await waitFor(() => expect(screen.queryByTestId('agents-read-only')).not.toBeNull());

    expect(screen.queryByRole('button', { name: /Create Agent/i })).toBeNull();
    // El formulario entero va dentro de un <fieldset disabled> (A-6).
    const fieldset = document.querySelector('fieldset');
    expect(fieldset).not.toBeNull();
    expect((fieldset as HTMLFieldSetElement).disabled).toBe(true);
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
  });

  it('el detalle: sin control de estado, sin «Guardar» y sin canales (viewer)', async () => {
    renderEs(<AgentDetailPage />);
    await waitFor(() => expect(screen.queryAllByText('Agente Uno').length).toBeGreaterThan(0));

    expect(screen.queryAllByTestId("agents-read-only").length).toBeGreaterThan(0);
    // El control de estado es una insignia, no un <select>.
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('button', { name: /Save changes/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Channels' }));
    await waitFor(() => expect(screen.queryByText('Assign')).toBeNull());
    expect(screen.queryByRole('button', { name: /Unassign/i })).toBeNull();
  });

  it('con el rol DESCONOCIDO, el panel se comporta como hoy (decide el backend)', async () => {
    state.role = null;
    renderEs(<AgentsPage />);
    await waitFor(() => expect(screen.queryByText('Agente Uno')).not.toBeNull());

    expect(screen.queryByRole('link', { name: 'Crear agente' })).not.toBeNull();
    expect(screen.queryByTestId('agents-read-only')).toBeNull();

    cleanup();
    renderEs(<CreateAgentPage />);
    await waitFor(() => expect(screen.queryByRole('button', { name: /Create Agent/i })).not.toBeNull());
    const fieldset = document.querySelector('fieldset') as HTMLFieldSetElement | null;
    expect(fieldset?.disabled ?? false).toBe(false);
  });

  it('con dueño, el detalle sigue como hoy (control de estado y «Guardar»)', async () => {
    state.role = 'owner';
    renderEs(<AgentDetailPage />);
    await waitFor(() => expect(screen.queryAllByText('Agente Uno').length).toBeGreaterThan(0));

    expect(screen.queryByTestId('agents-read-only')).toBeNull();
    expect(screen.queryByRole('combobox')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Configuration' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Save changes/i })).not.toBeNull(),
    );
  });
});
