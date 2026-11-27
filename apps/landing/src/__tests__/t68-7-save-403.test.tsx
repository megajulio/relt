import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';

/**
 * ORDEN-68 · Bloque 2 · T68-7 · ANEXO-68-A · A-6 y R3.
 *
 * Un 403 al guardar: el aviso de solo lectura (`agents.read_only_role`), **sin
 * perder lo escrito** y **sin reintentar solo**. Aquí el rol es `owner` (así el
 * panel muestra «Guardar» y el 403 llega del backend, que es el que decide).
 */

const state = vi.hoisted(() => ({ role: 'owner' as string | null }));

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({
    data: {
      user: { id: 'u-1', email: 'u@example.invalid', name: 'User' },
      organizations: [{ id: 'org-1', name: 'Org', role: state.role }],
    },
    logout: async () => {},
  }),
}));

const patchAgentConfig = vi.fn();

vi.mock('@/lib/agents', () => ({
  getAgent: vi.fn(),
  patchAgentConfig: (...args: unknown[]) => patchAgentConfig(...args),
}));

vi.mock('@/lib/models', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/models')>();
  return { ...actual, listModels: vi.fn(async () => []) };
});

import AgentConfigForm from '@/components/agent-config-form';
import { renderWithI18n } from './render-with-i18n';

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
  bindings: [],
} as never;

describe('T68-7 · un 403 al guardar: aviso, sin perder lo escrito y sin reintentar', () => {
  beforeEach(() => {
    state.role = 'owner';
    patchAgentConfig.mockReset();
  });
  afterEach(() => cleanup());

  it('muestra el aviso, conserva el texto y llama UNA sola vez', async () => {
    patchAgentConfig.mockRejectedValue(
      Object.assign(new Error("Se requiere rol 'admin' o superior. Rol actual: 'viewer'"), {
        status: 403,
      }),
    );

    renderWithI18n(<AgentConfigForm agent={agent} onSaved={vi.fn()} />, 'es');

    const textarea = screen.getByLabelText('Ajuste de este agente') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Texto que no se puede perder' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(
        screen.queryByText('Tu rol permite ver los agentes, no modificarlos.'),
      ).not.toBeNull(),
    );
    // No se pierde lo escrito…
    expect((screen.getByLabelText('Ajuste de este agente') as HTMLTextAreaElement).value).toBe(
      'Texto que no se puede perder',
    );
    // …y no se reintenta solo.
    expect(patchAgentConfig).toHaveBeenCalledTimes(1);
  });
});
