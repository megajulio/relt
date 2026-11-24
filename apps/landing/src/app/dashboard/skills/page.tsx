'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDashboardAuth } from '@/components/dashboard/DashboardAuthProvider';
import {
  createOrgSkill,
  listSkillsWithTools,
  patchOrgSkill,
  type SkillWithTools,
} from '@/lib/skills';
import { capabilityPhrases } from '@/lib/skill-labels';
import { skillErrorFrom } from '@/lib/skill-errors';
import { countChars, MAX_SKILL_INSTRUCTIONS } from '@/lib/count-chars';
import { useT } from '@/i18n/provider';

const inputCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500';

const labelCls = 'block text-sm font-medium text-gray-400 mb-1';

/**
 * Orden #57 · Bloque 3 (ANEXO-57-G) · D7 / T57-17 — página de skills (`/dashboard/skills`).
 *
 * - las skills del repositorio aparecen «De RELT», de solo lectura;
 * - las de la org se crean desde una base (tools como checkboxes, contador n/8000), se
 *   editan y se archivan; un 409 al archivar muestra «La usan N agentes»;
 * - los errores se muestran en lenguaje claro (G-4.2). El panel NO inventa las tools:
 *   las lee de la API (G-3).
 */
export default function SkillsPage() {
  const t = useT();
  useDashboardAuth();

  const [skills, setSkills] = useState<SkillWithTools[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState<string | null>(null);
  const [base, setBase] = useState('');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const bases = useMemo(() => skills.filter((s) => s.kind === 'repo'), [skills]);
  const baseSkill = bases.find((s) => s.name === base);
  const baseTools = baseSkill?.tools ?? [];

  const refresh = useCallback(async () => {
    const items = await listSkillsWithTools();
    setSkills(items);
    return items;
  }, []);

  useEffect(() => {
    let cancelled = false;
    listSkillsWithTools()
      .then((items) => {
        if (cancelled) return;
        setSkills(items);
        const firstRepo = items.find((s) => s.kind === 'repo');
        if (firstRepo) {
          setBase(firstRepo.name);
          setTools(firstRepo.tools);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('No se pudieron cargar las skills.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setEditing(null);
    setName('');
    setDisplayName('');
    setDescription('');
    setInstructions('');
    setBase(bases[0]?.name ?? '');
    setTools(bases[0]?.tools ?? []);
    setFormError(null);
  }

  function startEdit(skill: SkillWithTools) {
    setEditing(skill.name);
    setName(skill.name);
    setDisplayName(skill.display_name ?? skill.name);
    setDescription(skill.description ?? '');
    setInstructions(skill.instructions ?? '');
    setTools(skill.allowed_tools ?? skill.tools);
    setBase(skill.base_skill ?? '');
    setFormError(null);
    setNotice(null);
  }

  function handleBaseChange(next: string) {
    setBase(next);
    setTools(bases.find((s) => s.name === next)?.tools ?? []);
  }

  function toggleTool(tool: string) {
    setTools((prev) => (prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setNotice(null);
    setSaving(true);
    try {
      if (editing) {
        await patchOrgSkill(editing, {
          display_name: displayName,
          description,
          instructions,
          allowed_tools: tools,
        });
        setNotice(t('skills.notice.updated'));
      } else {
        await createOrgSkill({
          name: name.trim(),
          display_name: displayName.trim() || undefined,
          description,
          base_skill: base,
          instructions,
          allowed_tools: tools,
        });
        setNotice(t('skills.notice.created'));
      }
      await refresh();
      resetForm();
    } catch (err) {
      setFormError(skillErrorFrom(t, err));
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(skill: SkillWithTools) {
    setFormError(null);
    setNotice(null);
    try {
      await patchOrgSkill(skill.name, { status: 'archived' });
      setNotice(t('skills.notice.archived'));
      await refresh();
    } catch (err) {
      setFormError(skillErrorFrom(t, err));
    }
  }

  const chars = countChars(instructions);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{t("skills.skills")}</h1>
        <p className="text-gray-400 mt-1">
          {t("skills.skills-de-relt-solo-lectura-y-skills-de-tu-organizacion")}
        </p>
      </div>

      {loadError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
          {loadError}
        </div>
      )}
      {loading && <div className="text-gray-400">{t("skills.cargando-skills")}</div>}

      {!loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t("skills.skill")}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t("skills.origen")}</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t("skills.acciones")}</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill.name} className="border-b border-gray-800 last:border-0">
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{skill.display_name ?? skill.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{skill.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {capabilityPhrases(t, skill.tools).join(' · ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {skill.kind === 'repo' ? (
                      <span className="text-gray-400">{t("skills.de-relt")}</span>
                    ) : (
                      <span className="text-blue-300">{t("skills.de-tu-organizacion")}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {skill.kind === 'repo' ? (
                      <span className="text-xs text-gray-500">{t("skills.solo-lectura")}</span>
                    ) : (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(skill)}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          {t("skills.editar")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchive(skill)}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          {t("skills.archivar")}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h2 className="text-xl font-semibold text-white">
          {editing ? `Editar ${editing}` : 'Nueva skill'}
        </h2>

        {formError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
            {formError}
          </div>
        )}
        {notice && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-300">
            {notice}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="skill-name" className={labelCls}>
              {t("skills.nombre")}
            </label>
            <input
              id="skill-name"
              type="text"
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving || editing !== null}
              placeholder={t("skills.mi-skill")}
            />
          </div>
          <div>
            <label htmlFor="skill-base" className={labelCls}>
              {t("skills.skill-base")}
            </label>
            <select
              id="skill-base"
              className={inputCls}
              value={base}
              onChange={(e) => handleBaseChange(e.target.value)}
              disabled={saving || editing !== null}
            >
              {bases.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="skill-display-name" className={labelCls}>
              {t("skills.nombre-visible")}
            </label>
            <input
              id="skill-display-name"
              type="text"
              className={inputCls}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="skill-description" className={labelCls}>
              {t("skills.descripcion")}
            </label>
            <input
              id="skill-description"
              type="text"
              className={inputCls}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <label htmlFor="skill-instructions" className={labelCls}>
            {t("skills.instrucciones")} <span className="text-gray-500">{chars}/{MAX_SKILL_INSTRUCTIONS}</span>
          </label>
          <textarea
            id="skill-instructions"
            rows={6}
            className={inputCls}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            disabled={saving}
          />
        </div>

        <div>
          <div className={labelCls}>{t("skills.capacidades")}</div>
          <div className="space-y-2">
            {baseTools.length === 0 && (
              <div className="text-xs text-gray-500">{t("skills.la-skill-base-no-declara-capacidades")}</div>
            )}
            {baseTools.map((tool) => (
              <label key={tool} className="flex items-center gap-2 text-sm text-gray-200">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600"
                  checked={tools.includes(tool)}
                  onChange={() => toggleTool(tool)}
                  disabled={saving}
                />
                <span className="font-mono text-xs text-gray-500">{tool}</span>
                <span>{capabilityPhrases(t, [tool])[0]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white"
            >
              {t("skills.cancelar")}
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium px-6 py-2 rounded-lg"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>

    </div>
  );
}

