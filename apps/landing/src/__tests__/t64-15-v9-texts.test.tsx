import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';

/**
 * T64-15 (Orden #64 · ANEXO-64-E · E-2, V9) — los textos de V9, en `es` y `en`, en la
 * skill y en el agente. Las instrucciones de una skill se llaman «Cómo hacer la tarea»
 * (`How to do the task`); las del agente siguen siendo «Instrucciones del negocio»
 * (`Business instructions`).
 */

const SKILL_HELP_ES =
  'Pasos y criterios de esta skill. Lo de tu negocio (tono, horarios, políticas) va en Instrucciones del negocio.';
const SKILL_HELP_EN =
  'Steps and criteria for this skill. Anything about your business (tone, hours, policies) goes in Business instructions.';

const SKILLS = [
  repoSkill(),
  orgSkill({
    name: 'tienda',
    display_name: 'Tienda',
    status: 'draft',
    current_version: null,
    has_unpublished_changes: true,
    published_tools: null,
    latest_version: '1',
  }),
];

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({ useDashboardAuth: () => ({}) }));
vi.mock('@/lib/agents', () => ({
  getAgent: vi.fn(),
  patchAgentConfig: vi.fn(async () => undefined),
}));
vi.mock('@/lib/skills', () => ({
  listSkillsWithTools: vi.fn(async () => SKILLS),
  listSkills: vi.fn(async () => SKILLS),
  getSkill: vi.fn(),
  createOrgSkill: vi.fn(async () => ({})),
  patchOrgSkill: vi.fn(async () => ({})),
  getPublishPreview: vi.fn(),
  publishOrgSkill: vi.fn(),
  listSkillVersions: vi.fn(async () => ({ versions: [], total: 0 })),
}));

import SkillsPage from '@/app/dashboard/skills/page';
import AgentConfigForm from '@/components/agent-config-form';
import { orgSkill, repoSkill } from './t64-fixtures';
import { renderWithI18n } from './render-with-i18n';
import type { Locale } from '@/i18n/types';

const AGENT = {
  id: 'a1', organizationId: 'o1', key: 'k', name: 'A', status: 'active' as const,
  defaultSkill: 'general', config: { systemPrompt: 'abc' },
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', bindings: [],
};

async function renderSkillPage(locale: Locale) {
  renderWithI18n(<SkillsPage />, locale);
  await waitFor(() =>
    expect(document.querySelectorAll('[data-testid="skill-row"]').length).toBe(SKILLS.length),
  );
}

describe('T64-15 · textos de V9 (es y en)', () => {
  afterEach(() => cleanup());
  beforeEach(() => vi.clearAllMocks());

  it('en la skill, es: «Cómo hacer la tarea» y su ayuda', async () => {
    await renderSkillPage('es');
    expect(screen.queryByLabelText(/Cómo hacer la tarea/)).not.toBeNull();
    expect(screen.queryByText(SKILL_HELP_ES)).not.toBeNull();
  });

  it('en la skill, en: «How to do the task» y su ayuda', async () => {
    await renderSkillPage('en');
    expect(screen.queryByLabelText(/How to do the task/)).not.toBeNull();
    expect(screen.queryByText(SKILL_HELP_EN)).not.toBeNull();
  });

  it('en el agente, es: «Ajuste de este agente»', () => {
    renderWithI18n(<AgentConfigForm agent={AGENT} onSaved={() => {}} />, 'es');
    expect(screen.queryByLabelText('Ajuste de este agente')).not.toBeNull();
  });

  it('en el agente, en: «Agent adjustment»', () => {
    renderWithI18n(<AgentConfigForm agent={AGENT} onSaved={() => {}} />, 'en');
    expect(screen.queryByLabelText('Agent adjustment')).not.toBeNull();
  });
});
