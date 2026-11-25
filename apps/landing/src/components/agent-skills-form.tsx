'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAgent, patchAgentConfig, type AgentDetail } from '@/lib/agents';
import {
  listSkillVersions,
  listSkills,
  type SkillListItem,
  type SkillVersionRecord,
} from '@/lib/skills';
import { selectableSkills, selectorTools } from '@/lib/skill-catalog';
import { capabilitiesLabel } from '@/lib/skill-labels';
import { skillErrorFrom } from '@/lib/skill-errors';
import { useT } from '@/i18n/provider';

const inputCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500';

/**
 * Orden #57 · Bloque 3 (ANEXO-57-G) · D5 — pestaña Skills del detalle del agente.
 * Orden #64 · ANEXO-64-E (E-2, V8):
 * - con una skill de org: «Automática (última versión)» o «Fijar versión», con las
 *   versiones de `GET …/versions`; con una de RELT, como hoy;
 * - Automática manda `{ skill }`; fijada manda `{ skill, version }`; al cambiar de
 *   skill vuelve a Automática;
 * - nada se cambia en silencio: si la skill actual o la versión fijada ya no están en
 *   la lista, se muestran marcadas como no disponibles y guardar no las reemplaza.
 */
export default function AgentSkillsForm({
  agent,
  onSaved,
}: {
  agent: AgentDetail;
  onSaved: (a: AgentDetail) => void;
}) {
  const t = useT();
  const [catalog, setCatalog] = useState<SkillListItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [orgVersions, setOrgVersions] = useState<SkillVersionRecord[]>([]);

  const [skill, setSkill] = useState(agent.config.skillBinding?.skill ?? agent.defaultSkill ?? '');
  const [mode, setMode] = useState<'automatic' | 'pinned'>(
    agent.config.skillBinding?.version ? 'pinned' : 'automatic'
  );
  const [version, setVersion] = useState(agent.config.skillBinding?.version ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    listSkills()
      .then(setCatalog)
      .catch(() => setCatalog([]))
      .finally(() => setLoadingCatalog(false));
  }, []);

  // V8: al cambiar de agente (id o `updatedAt`) se resincroniza el formulario. Se hace
  // durante el render (el patrón de React para estado derivado de props) y no en un
  // efecto, para no llamar a `setState` en sincronía dentro de un efecto.
  const agentKey = `${agent.id}:${agent.updatedAt}`;
  const [syncedKey, setSyncedKey] = useState(agentKey);
  if (syncedKey !== agentKey) {
    setSyncedKey(agentKey);
    setSkill(agent.config.skillBinding?.skill ?? agent.defaultSkill ?? '');
    setMode(agent.config.skillBinding?.version ? 'pinned' : 'automatic');
    setVersion(agent.config.skillBinding?.version ?? '');
  }

  // V8: el selector solo ofrece las de RELT y las de org `active`.
  const visibleCatalog = useMemo(() => selectableSkills(catalog), [catalog]);
  const skillAvailable = visibleCatalog.some((s) => s.name === skill);
  const selected = visibleCatalog.find((s) => s.name === skill);
  const isOrg = selected?.kind === 'org';

  // V8: con una skill de org, las versiones salen de `GET …/versions`.
  useEffect(() => {
    if (!isOrg || !skill) return;
    let cancelled = false;
    listSkillVersions(skill)
      .then((res) => {
        if (!cancelled) setOrgVersions(res.versions);
      })
      .catch(() => {
        if (!cancelled) setOrgVersions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOrg, skill]);

  const versionOptions = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = [];
    if (isOrg) {
      for (const v of orgVersions) {
        opts.push({ value: v.version, label: `${t('agents.skills.v')}${v.version}` });
      }
      if (version && !opts.some((o) => o.value === version)) {
        opts.push({
          value: version,
          label: `${t('agents.skills.v')}${version} (${t('agents.skills.version-no-disponible')})`,
        });
      }
    } else {
      if (selected) {
        opts.push({
          value: selected.latest_version,
          label: `${t('agents.skills.v')}${selected.latest_version} ${t('agents.skills.latest')}`,
        });
      }
      if (version && version !== selected?.latest_version) {
        opts.push({
          value: version,
          label: selected
            ? `${t('agents.skills.v')}${version}`
            : `${t('agents.skills.v')}${version} (${t('agents.skills.version-no-disponible')})`,
        });
      }
    }
    return opts;
  }, [isOrg, orgVersions, selected, version, t]);

  const originalSkill = agent.config.skillBinding?.skill ?? agent.defaultSkill ?? '';
  const originalMode = agent.config.skillBinding?.version ? 'pinned' : 'automatic';
  const originalVersion = agent.config.skillBinding?.version ?? '';
  const dirty =
    skill !== originalSkill ||
    mode !== originalMode ||
    (mode === 'pinned' && version.trim() !== originalVersion);

  function handleSkillChange(next: string) {
    setSkill(next);
    // V8: al cambiar de skill vuelve a Automática.
    setMode('automatic');
    setVersion('');
  }

  function handleModeChange(nextMode: 'automatic' | 'pinned') {
    setMode(nextMode);
    if (nextMode === 'pinned' && !version) {
      if (isOrg) setVersion(orgVersions[0]?.version ?? '');
      else if (selected) setVersion(selected.latest_version);
    }
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    if (!skill) {
      setError(t('agents.skills.seleccionar'));
      return;
    }
    setSaving(true);
    try {
      // V8: Automática manda `{ skill }`; fijada manda `{ skill, version }`.
      const v = mode === 'pinned' ? version.trim() : '';
      await patchAgentConfig(agent.id, {
        skillBinding: v ? { skill, version: v } : { skill },
      });
      const fresh = await getAgent(agent.id);
      onSaved(fresh);
      setSaved(true);
    } catch (err: unknown) {
      // G-4.2 / E-2: al usuario nunca se le muestra el código crudo.
      setError(skillErrorFrom(t, err));
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setSkill(originalSkill);
    setMode(originalMode);
    setVersion(originalVersion);
    setError(null);
    setSaved(false);
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {saved && !dirty && !error && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-300">
          {t("agents.skills.skill-binding-guardado-correctamente")}
        </div>
      )}

      <div>
        <div className="text-sm text-gray-400 mb-1.5">{t("agents.skills.skill")}</div>
        <select className={inputCls} value={skill} onChange={(e) => handleSkillChange(e.target.value)}>
          <option value="">{t("agents.skills.seleccionar")}</option>
          {!skillAvailable && skill && (
            <option value={skill}>{`${skill} (${t('agents.skills.skill-no-disponible')})`}</option>
          )}
          {visibleCatalog.map((s) => {
            const tools = selectorTools(s);
            const origin = s.kind === 'repo' ? t('skills.de-relt') : t('skills.de-tu-organizacion');
            const caps = tools.length ? ` — ${capabilitiesLabel(t, tools)}` : '';
            return (
              <option key={s.name} value={s.name}>{`${s.name} (${origin})${caps}`}</option>
            );
          })}
        </select>
      </div>

      <div className="space-y-3">
        <div className="text-sm text-gray-400 mb-1.5">{t("agents.skills.skill-version")}</div>
        <div className="space-y-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="versionMode"
              value="automatic"
              checked={mode === 'automatic'}
              onChange={() => handleModeChange('automatic')}
              className="mt-1 w-4 h-4 accent-blue-600"
            />
            <div className="flex-1">
              <div className="text-sm text-gray-200">
                {isOrg ? t("agents.skills.automatica-ultima-version") : t("agents.skills.automatica")}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {t("agents.skills.usa-la-version-resuelta-por-el-sistema-latest")}
              </div>
            </div>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="radio"
              name="versionMode"
              value="pinned"
              checked={mode === 'pinned'}
              onChange={() => handleModeChange('pinned')}
              className="mt-1 w-4 h-4 accent-blue-600"
            />
            <div className="flex-1">
              <div className="text-sm text-gray-200 mb-1.5">{t("agents.skills.fijar-version")}</div>
              <select
                aria-label={t("agents.skills.skill-version")}
                className={inputCls + ' disabled:opacity-40 disabled:cursor-not-allowed'}
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                disabled={mode !== 'pinned'}
              >
                {versionOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </label>
        </div>
      </div>

      {loadingCatalog && (
        <div className="text-sm text-gray-500">{t("agents.skills.cargando-catalogo-de-skills")}</div>
      )}

      {selected && (
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 space-y-3">
          <div className="text-sm text-gray-300">{selected.description}</div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {selected.kind === 'repo' ? (
              <span>{t("agents.skills.latest-v")}{selected.latest_version}</span>
            ) : (
              <span>{t("skills.version")}: {selected.current_version ?? t("skills.sin-publicar")}</span>
            )}
            <span>{selected.tools_count} {t("agents.skills.tools")}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectorTools(selected).map((tool) => (
              <span key={tool} className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-xs font-mono">
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleReset}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t("agents.skills.reset")}
        </button>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? t("agents.skills.guardando") : t("agents.skills.guardar-cambios")}
        </button>
      </div>
    </div>
  );
}
