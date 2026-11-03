import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AgentConfigForm from '@/components/agent-config-form';
import type { AgentDetail } from '@/lib/agents';

/**
 * U0 · Smoke test del harness: valida que Vitest + jsdom + Testing Library
 * transforman JSX, resuelven el alias `@/*` y renderizan un componente real.
 */
describe('U0 · harness', () => {
  it('renderiza AgentConfigForm', () => {
    const agent: AgentDetail = {
      id: 'agent-smoke',
      organizationId: 'org-smoke',
      key: 'smoke',
      name: 'Smoke Agent',
      status: 'active',
      defaultSkill: 'general',
      config: { maxSteps: 5, tone: 'neutral', systemPrompt: 'hola' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      bindings: [],
    };

    render(<AgentConfigForm agent={agent} onSaved={() => {}} />);

    expect(screen.getByText('Max steps')).toBeTruthy();
    expect(screen.getByText('Tone')).toBeTruthy();
    expect(screen.getByText('System prompt')).toBeTruthy();
  });
});
