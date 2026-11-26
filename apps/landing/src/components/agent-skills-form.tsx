'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getAgent, patchAgentConfig, type AgentDetail } from '@/lib/agents';
import {
  listSkillVersions,
  listSkills,
  type SkillListItem,
  type SkillVersionRecord,
} from '@/lib/skills';
import { selectableSkills, selectorTools } from '@/lib/skill-catalog';
import { capabilitiesLabel, capabilityPhrases } from '@/lib/skill-labels';
import { skillErrorFrom, skillLoadErrorFrom } from '@/lib/skill-errors';
import { isRoleForbidden, useAgentAccess } from '@/lib/agent-role';
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
 * Orden #64 · ANEXO-64-G (G-1, N1 a N3):
 * - el catálogo tiene tres estados (cargando, error y cargado), y «No disponible» solo
 *   sale con el catálogo cargado bien y, en una skill de org, con SUS versiones cargadas;
 * - las versiones se guardan con el nombre de su skill y las de otra no se usan nunca;
 * - mientras cargan o si fallan, la versión fijada se ve en la lista SIN marca.
 */
export default function AgentSkillsForm({
  agent,
  onSaved,
}: {
  agent: AgentDetail;
  onSaved: (a: AgentDetail) => void;
}) {
  const t = useT();
  // ORDEN-68 · R3/A-6: member y viewer no tienen «Guardar».
  const access = useAgentAccess();
  const [catalog, setCatalog] = useState<SkillListItem[]>([]);
  // N1: el catálogo tiene TRES estados: cargando, error y cargado.
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  // N2: las versiones se guardan CON el nombre de su skill; las de otra no se usan.
  const [versions, setVersions] = useState<{ skill: string; items: SkillVersionRecord[] } | null>(
    null,
  );
  // M5/N1: la carga de versiones tiene sus tres estados (cargando, error y cargado).
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<{ skill: string; message: string } | null>(
    null,
  );

  const [skill, setSkill] = useState(agent.config.skillBinding?.skill ?? agent.defaultSkill ?? '');
  const [mode, setMode] = useState<'automatic' | 'pinned'>(
    agent.config.skillBinding?.version ? 'pinned' : 'automatic'
  );
  const [version, setVersion] = useState(agent.config.skillBinding?.version ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listSkills()
      .then((items) => {
        if (cancelled) return;
        setCatalog(items);
        setCatalogError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        // N1/N5: el error del catálogo no se silencia; su texto de carga es el genérico.
        setCatalog([]);
        setCatalogError(skillLoadErrorFrom(t, err));
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

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
  // N1: el catálogo cargado BIEN (ni cargando ni con error).
  const catalogLoaded = !catalogLoading && catalogError === null;
  // N2: solo se usan las versiones de ESTA skill.
  const versionsOfSkill = useMemo(
    () => (versions?.skill === skill ? versions.items : []),
    [versions, skill],
  );
  const versionsErrorOfSkill = versionsError?.skill === skill ? versionsError.message : null;
  const versionsLoaded =
    versions !== null &&
    versions.skill === skill &&
    !versionsLoading &&
    versionsErrorOfSkill === null;

  // M4: el modo actual se guarda en un ref para leerlo dentro del callback de la carga de
  // versiones sin reejecutarla cuando cambia.
  const pinnedRef = useRef(false);
  useEffect(() => {
    pinnedRef.current = mode === 'pinned';
  }, [mode]);

  // V8/M5: con una skill de org, las versiones salen de `GET …/versions`, con sus tres
  // estados (cargando, error y cargado). M6/N2: una respuesta atrasada de otra skill se
  // descarta y, además, queda guardada con SU nombre, así que nunca se pinta en otra.
  // Los cambios de estado van en un microtask, fuera del cuerpo síncrono del efecto.
  useEffect(() => {
    if (!isOrg || !skill) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setVersionsLoading(true);
      try {
        const res = await listSkillVersions(skill);
        if (cancelled) return;
        setVersions({ skill, items: res.versions });
        setVersionsError(null);
        // M4: si se había elegido fijar y no hay versión, se elige la más nueva EN EL ESTADO
        // (la API las da de la más nueva a la más vieja).
        if (pinnedRef.current) {
          setVersion((current) => current || (res.versions[0]?.version ?? ''));
        }
      } catch (err) {
        if (cancelled) return;
        setVersions(null);
        // N5: un fallo de CARGA usa el texto de carga, no el de guardar.
        setVersionsError({ skill, message: skillLoadErrorFrom(t, err) });
      } finally {
        if (!cancelled) setVersionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOrg, skill, t]);

  // N1/M4: al llegar el catálogo, si se había elegido fijar y no hay versión, también una
  // skill de RELT elige la más nueva EN EL ESTADO (no solo en la pantalla).
  useEffect(() => {
    if (!catalogLoaded || mode !== 'pinned' || version || isOrg || !selected) return;
    void Promise.resolve().then(() => {
      setVersion((current) => current || selected.latest_version);
    });
  }, [catalogLoaded, mode, version, isOrg, selected]);

  const versionOptions = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = [];
    if (isOrg) {
      for (const v of versionsOfSkill) {
        opts.push({ value: v.version, label: `${t('agents.skills.v')}${v.version}` });
      }
      if (version && !opts.some((o) => o.value === version)) {
        // N1: «Versión no disponible» SOLO con el catálogo y SUS versiones cargadas bien.
        // N3: mientras cargan o si fallan, la versión fijada se ve SIN marca.
        const marcada = versionsLoaded && catalogLoaded;
        opts.push({
          value: version,
          label: marcada
            ? `${t('agents.skills.v')}${version} (${t('agents.skills.version-no-disponible')})`
            : `${t('agents.skills.v')}${version}`,
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
        // N1/N3: sin catálogo cargado bien no se marca como no disponible.
        const marcada = catalogLoaded && !selected;
        opts.push({
          value: version,
          label: marcada
            ? `${t('agents.skills.v')}${version} (${t('agents.skills.version-no-disponible')})`
            : `${t('agents.skills.v')}${version}`,
        });
      }
    }
    return opts;
  }, [isOrg, versionsOfSkill, catalogLoaded, selected, version, t, versionsLoaded]);

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
    // M6: las versiones anteriores se vacían al cambiar de skill.
    setVersions(null);
    setVersionsError(null);
  }

  function handleModeChange(nextMode: 'automatic' | 'pinned') {
    setMode(nextMode);
    if (nextMode === 'pinned' && !version) {
      if (isOrg) setVersion(versionsOfSkill[0]?.version ?? '');
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
    // M4/E-2: con «Fijar versión» y sin una versión elegida, NO se guarda y se explica.
    if (mode === 'pinned' && !version.trim()) {
      setError(t('agents.skills.version-requerida'));
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
      // R3/A-6: un 403 de la guarda usa el aviso de solo lectura.
      setError(isRoleForbidden(err) ? t('agents.read_only_role') : skillErrorFrom(t, err));
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
      {access.readOnly && (
        <div
          data-testid="agents-read-only"
          className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300"
        >
          {t('agents.read_only_role')}
        </div>
      )}
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
          {catalogLoaded && !skillAvailable && skill && (
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

      {catalogLoading && (
        <div className="text-sm text-gray-500">{t("agents.skills.cargando-catalogo-de-skills")}</div>
      )}
      {/* N1/N5: el error del catálogo se muestra, con el texto de carga. */}
      {catalogError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
          {catalogError}
        </div>
      )}

      {/* M5: la carga de las versiones de una skill de org, con sus tres estados. */}
      {isOrg && versionsLoading && (
        <div className="text-sm text-gray-500">{t("agents.skills.cargando-versiones")}</div>
      )}
      {isOrg && versionsErrorOfSkill && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
          {versionsErrorOfSkill}
        </div>
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
            {/* M11: el número es el de las tools PUBLICADAS (selectorTools), no la copia de trabajo. */}
            <span>{selectorTools(selected).length} {t("agents.skills.tools")}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectorTools(selected).length ? (
              selectorTools(selected).map((tool) => (
                <span key={tool} className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-xs">
                  {capabilityPhrases(t, [tool])[0]}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">{t('skills.tools.ninguna')}</span>
            )}
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
        {!access.readOnly && (
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? t("agents.skills.guardando") : t("agents.skills.guardar-cambios")}
          </button>
        )}
      </div>
    </div>
  );
}
