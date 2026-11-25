'use client';

import { capabilitiesLabel } from '@/lib/skill-labels';
import { selectableSkills, selectorTools } from '@/lib/skill-catalog';
import type { SkillKind, SkillStatus } from '@/lib/skills';
import { useT } from '@/i18n/provider';

/**
 * Orden #57 · Bloque 3-bis (ANEXO-57-G1) · D5 — selector de skill del alta.
 * Orden #64 · ANEXO-64-E (E-2): solo las skills de RELT y las de org `active`
 * (V8), y muestra las capacidades **publicadas** (`published_tools`, A-3), no la
 * copia de trabajo. Obligatorio, precargado con `general` por el llamador.
 */
export default function SkillSelect({
  skills,
  value,
  onChange,
  disabled,
  className,
}: {
  skills: Array<{
    name: string;
    kind?: SkillKind;
    status?: SkillStatus;
    tools?: string[];
    published_tools?: string[] | null;
  }>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useT();
  const visible = selectableSkills(
    skills.map((skill) => ({ ...skill, kind: (skill.kind ?? 'repo') as SkillKind })),
  );
  return (
    <select
      id="default-skill"
      aria-label={t("agents.select.default-skill")}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {visible.map((skill) => {
        const tools = selectorTools({
          kind: skill.kind,
          tools: skill.tools,
          published_tools: skill.published_tools,
        });
        return (
          <option key={skill.name} value={skill.name}>
            {tools.length ? `${skill.name} — ${capabilitiesLabel(t, tools)}` : skill.name}
          </option>
        );
      })}
    </select>
  );
}
