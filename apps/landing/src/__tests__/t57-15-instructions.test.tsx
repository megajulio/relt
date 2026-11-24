import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { countChars, MAX_BUSINESS_INSTRUCTIONS, normalizeText } from '@/lib/count-chars';

/**
 * T57-15 (Orden #57 · Bloque 3 · ANEXO-57-G) — «Instrucciones del negocio» (D4).
 * Criterios: el contador n/4000 usa `countChars` (10 emojis cuentan 10); con más de 4000 se
 * deshabilita Guardar; el aviso de marcadores aparece y desaparece.
 * El vector de A-5 va copiado literalmente.
 */

vi.mock('@/lib/agents', () => ({
  getAgent: vi.fn(),
  patchAgentConfig: vi.fn(async () => undefined),
}));

import AgentConfigForm from '@/components/agent-config-form';
import { renderWithI18n } from './render-with-i18n';

const render = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, 'es');

const AGENT = {
  id: 'a1',
  organizationId: 'o1',
  key: 'k',
  name: 'A',
  status: 'active' as const,
  defaultSkill: 'general',
  config: { systemPrompt: 'abc' },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  bindings: [],
};

/** Vector de A-5, copiado literalmente. */
const VECTOR: Array<[string, number]> = [
  ['', 0],
  ['abc', 3],
  ['\u{1F600}', 1],
  ['a\r\nb', 3],
  ['a\rb', 3],
  ['  x  ', 1],
  ['\t', 0],
  ['é', 1],
  ['e\u0301', 2],
  ['\u{1F44D}\u{1F3FD}', 2],
];

describe('T57-15 · Instrucciones del negocio (D4)', () => {
  afterEach(() => cleanup());

  it('countChars usa code points Unicode tras normalizar (vector A-5)', () => {
    for (const [input, expected] of VECTOR) {
      expect(countChars(input)).toBe(expected);
    }
    expect(normalizeText('a\r\nb')).toBe('a\nb');
    expect(countChars('\u{1F600}'.repeat(10))).toBe(10);
  });

  it('muestra el contador n/4000 y el aviso de marcadores', () => {
    render(<AgentConfigForm agent={AGENT} onSaved={() => {}} />);
    const ta = screen.queryByLabelText('Instrucciones del negocio') as HTMLTextAreaElement | null;
    expect(ta).not.toBeNull();
    expect((ta as HTMLTextAreaElement).value).toBe('abc');
    expect(screen.queryByText('3/4000')).not.toBeNull();

    fireEvent.change(ta as HTMLTextAreaElement, { target: { value: 'Hola [nombre]' } });
    expect(screen.queryByText('Completa los datos entre corchetes')).not.toBeNull();
    fireEvent.change(ta as HTMLTextAreaElement, { target: { value: 'Hola negocio' } });
    expect(screen.queryByText('Completa los datos entre corchetes')).toBeNull();
  });

  it('con más de 4000 caracteres, Guardar se deshabilita', () => {
    render(<AgentConfigForm agent={AGENT} onSaved={() => {}} />);
    const ta = screen.queryByLabelText('Instrucciones del negocio') as HTMLTextAreaElement | null;
    expect(ta).not.toBeNull();
    fireEvent.change(ta as HTMLTextAreaElement, {
      target: { value: 'x'.repeat(MAX_BUSINESS_INSTRUCTIONS + 1) },
    });
    const save = screen.getByRole('button', { name: 'Save changes' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
  });
});
