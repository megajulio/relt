import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen } from '@testing-library/react';
/**
 * T57-16 (Orden #57 · Bloque 3 · ANEXO-57-G) — pestaña Memory (D6).
 * Criterios: los toggles corresponden a D6; y, como Q6 mostró que el resumen SÍ existe, su
 * toggle se queda (G-4.4). Si el resumen no existiera, su toggle no aparecería.
 */

vi.mock('@/lib/agents', () => ({
  getAgent: vi.fn(),
  patchAgentConfig: vi.fn(async () => undefined),
}));

import AgentMemoryForm from '@/components/agent-memory-form';
import { renderWithI18n } from './render-with-i18n';

const render = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, 'en');

const AGENT = {
  id: 'a1',
  organizationId: 'o1',
  key: 'k',
  name: 'A',
  status: 'active' as const,
  defaultSkill: 'general',
  config: {},
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  bindings: [],
};

describe('T57-16 · Memory (D6)', () => {
  afterEach(() => cleanup());

  it('los toggles corresponden a D6 y el de resumen se queda (el resumen existe)', () => {
    render(<AgentMemoryForm agent={AGENT} onSaved={() => {}} />);
    expect(screen.queryByText('Short-term memory')).not.toBeNull();
    expect(screen.queryByText('Si está apagado, el modelo no recibe mensajes previos.')).not.toBeNull();
    expect(screen.queryByText('Summary generation')).not.toBeNull();
    expect(screen.queryByText('Si está apagado, el resumen no se lee ni se genera.')).not.toBeNull();
  });
});
