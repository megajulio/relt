'use client';

import { capabilitiesLabel } from '@/lib/skill-labels';
import { useT } from '@/i18n/provider';

/**
 * Orden #57 · Bloque 3-bis (ANEXO-57-G1) · D5 — selector de skill del alta.
 *
 * Obligatorio, precargado con `general` por el llamador, e incluye las skills de la org.
 * Cada opción dice en lenguaje claro qué puede hacer, derivado de sus tools (G-4.1). Si la
 * skill no trae `tools` (listado simple, sin el detalle), la opción muestra solo su nombre.
 */
export default function SkillSelect({
  skills,
  value,
  onChange,
  disabled,
  className,
}: {
  skills: Array<{ name: string; tools?: string[] }>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useT();
  return (
    <select
      id="default-skill"
      aria-label={t("agents.select.default-skill")}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {skills.map((skill) => {
        const tools = skill.tools ?? [];
        return (
          <option key={skill.name} value={skill.name}>
            {tools.length ? `${skill.name} — ${capabilitiesLabel(t, tools)}` : skill.name}
          </option>
        );
      })}
    </select>
  );
}
