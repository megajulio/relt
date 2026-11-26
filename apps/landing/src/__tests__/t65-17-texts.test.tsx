import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';

/**
 * T65-17 (ORDEN-65 · Bloque 2 · ANEXO-65-B · A-5/N6 · DEC-020) — textos en `es` y `en`.
 *
 * Criterios: las claves nuevas existen en los dos catálogos con el texto pedido;
 * la plantilla es el literal de A-5 en los dos idiomas; el término de Tools es el
 * mismo que la pestaña Tools del agente en ese idioma; la pantalla de Tools pinta
 * en inglés.
 */

const getToolsOverview = vi.fn();

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({}),
}));
vi.mock('@/lib/tools', () => ({
  getToolsOverview: () => getToolsOverview(),
}));

import enJson from '@/i18n/messages/en.json';
import esJson from '@/i18n/messages/es.json';
import ToolsPage from '@/app/dashboard/tools/page';
import { renderWithI18n } from './render-with-i18n';

const es = esJson as Record<string, string>;
const en = enJson as Record<string, string>;

const TEMPLATE_ES =
  'Somos [nombre del negocio]. Vendemos [qué vendes].\nTono: [cercano / formal].\nPolíticas comerciales: [cambios, devoluciones, garantías].\nHorarios: [días y horas de atención].\nCondiciones de venta: [pagos, envíos, mínimos].\nRestricciones: [lo que el agente no debe hacer ni prometer].\nProcedimientos: [qué hacer en cada caso].\nSi te preguntan algo que no sabes (precios, stock, envíos), no lo inventes: di que una persona del equipo responderá pronto.';
const TEMPLATE_EN =
  'We are [business name]. We sell [what you sell].\nTone: [friendly / formal].\nSales policies: [exchanges, returns, warranties].\nOpening hours: [days and hours].\nTerms of sale: [payments, shipping, minimums].\nRestrictions: [what the agent must not do or promise].\nProcedures: [what to do in each case].\nIf you are asked something you do not know (prices, stock, shipping), do not make it up: say that a team member will reply soon.';

const KEYS = [
  'nav.businessInstructions',
  'nav.tools',
  'business.instructions.title',
  'business.instructions.help',
  'business.instructions.load-error',
  'business.instructions.retry',
  'business.instructions.save',
  'business.instructions.saving',
  'business.instructions.saved',
  'business.instructions.save-error',
  'business.instructions.use-template',
  'business.instructions.conflict',
  'business.instructions.conflict-load',
  'business.instructions.read-only',
  'business.org-template',
  'business.agent-adjustment',
  'business.agent-adjustment-help',
  'business.agent-adjustment-link',
  'tools.title',
  'tools.loading',
  'tools.load-error',
  'tools.retry',
  'tools.disclaimer',
  'tools.access.read',
  'tools.access.write',
  'tools.allowed',
  'tools.not-allowed',
  'tools.used-by',
  'tools.none',
  'tools.skill-blocked',
];

describe('T65-17 · textos de los Bloques 2 en es y en', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('las claves nuevas existen en los dos catálogos y no están vacías', () => {
    for (const key of KEYS) {
      expect(es[key], `es:${key}`).toBeTruthy();
      expect(en[key], `en:${key}`).toBeTruthy();
    }
  });

  it('la plantilla es el literal de A-5 en los dos idiomas', () => {
    expect(es['business.org-template']).toBe(TEMPLATE_ES);
    expect(en['business.org-template']).toBe(TEMPLATE_EN);
  });

  it('los nombres de los campos y el término de Tools', () => {
    expect(es['business.agent-adjustment']).toBe('Ajuste de este agente');
    expect(en['business.agent-adjustment']).toBe('Agent adjustment');
    expect(es['business.instructions.title']).toBe('Instrucciones del negocio');
    expect(en['business.instructions.title']).toBe('Business instructions');
    // La pestaña Tools del agente no se traduce (agents/[id]/page.tsx: TABS); el
    // menú y la pantalla usan ese mismo término en los dos idiomas.
    expect(es['nav.tools']).toBe('Tools');
    expect(en['nav.tools']).toBe('Tools');
    expect(es['nav.businessInstructions']).toBe('Instrucciones del negocio');
    expect(en['nav.businessInstructions']).toBe('Business instructions');
  });

  it('la pantalla de Tools pinta en inglés', async () => {
    getToolsOverview.mockResolvedValue([
      {
        name: 'products.search',
        access: 'read',
        required_permissions: ['products:read'],
        allowed: true,
        missing_permissions: [],
        skills: [],
      },
    ]);
    renderWithI18n(<ToolsPage />, 'en');

    await waitFor(() => expect(document.querySelectorAll('[data-testid="tool-row"]').length).toBe(1));
    expect(screen.getByText('Read')).not.toBeNull();
    expect(screen.getByText('Allowed')).not.toBeNull();
    expect(screen.getByText('No skill uses it')).not.toBeNull();
    expect(
      screen.getByText('Allowed does not mean every agent uses it: it depends on its skill.'),
    ).not.toBeNull();
  });
});
