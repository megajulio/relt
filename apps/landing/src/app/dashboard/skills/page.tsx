'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDashboardAuth } from '@/components/dashboard/DashboardAuthProvider';
import Modal from '@/components/modal';
import {
  createOrgSkill,
  getPublishPreview,
  getSkill,
  listSkillVersions,
  listSkillsWithTools,
  patchOrgSkill,
  publishOrgSkill,
  type PublishPreview,
  type SkillBump,
  type SkillStatus,
  type SkillVersionRecord,
  type SkillWithTools,
} from '@/lib/skills';
import { capabilityPhrases } from '@/lib/skill-labels';
import { skillErrorFrom, skillLoadErrorFrom } from '@/lib/skill-errors';
import { countChars, MAX_SKILL_INSTRUCTIONS } from '@/lib/count-chars';
import { useLocale, useT } from '@/i18n/provider';

const inputCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500';

const labelCls = 'block text-sm font-medium text-gray-400 mb-1';

/** V8: el orden es RELT → activas → borradores → archivadas. */
const GROUP: Record<SkillStatus, number> = { active: 1, draft: 2, archived: 3 };

function groupOf(skill: SkillWithTools): number {
  if (skill.kind === 'repo') return 0;
  return GROUP[skill.status ?? 'archived'];
}

function stateKey(skill: SkillWithTools): string {
  return `skills.state.${skill.status ?? 'archived'}`;
}

function bumpKey(bump: SkillBump): string {
  return `skills.bump.${bump}`;
}

/**
 * Orden #64 · ANEXO-64-E · E-2 (V8 y V9) — página de skills (`/dashboard/skills`).
 *
 * - la lista va en el orden RELT → activas → borradores → archivadas, con el estado,
 *   la `current_version` («Sin publicar» en un borrador sin versiones) y «Cambios sin
 *   publicar» en las activas que los tienen;
 * - las acciones dependen del estado; después de cada acción se vuelve a pedir la lista
 *   y el aviso de éxito sale solo con un 2xx; mientras se envía, el botón queda
 *   deshabilitado (dos clics son un pedido);
 * - publicar usa la vista previa (`publish-preview`), manda `expected_version` y avisa
 *   del MAJOR (V7); `publish_conflict` no publica solo;
 * - el historial va de la más nueva a la más vieja, en el orden de la API.
 */
export default function SkillsPage() {
  const t = useT();
  const locale = useLocale();
  useDashboardAuth();

  const [skills, setSkills] = useState<SkillWithTools[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState<string | null>(null);
  // M3: el detalle de la skill que se edita (el listado no trae `instructions`).
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [base, setBase] = useState('');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [publishing, setPublishing] = useState<SkillWithTools | null>(null);
  const [preview, setPreview] = useState<PublishPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [changelog, setChangelog] = useState('');
  const [publishSaving, setPublishSaving] = useState(false);
  const [publishFieldError, setPublishFieldError] = useState<string | null>(null);

  const [historyOf, setHistoryOf] = useState<SkillWithTools | null>(null);
  const [versions, setVersions] = useState<SkillVersionRecord[] | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);

  const submitBusy = useRef(false);
  const publishBusy = useRef(false);
  // H-1 (ANEXO-64-H): la base y las tools por defecto se ponen UNA sola vez, en la primera
  // carga que llega bien. El selector de idioma hace `router.refresh()`: conserva el
  // formulario y cambia `t`, así que este efecto vuelve a correr; esa carga posterior
  // actualiza la lista y NO puede reemplazar lo que el usuario está editando.
  const defaultsApplied = useRef(false);
  // M6: identificadores de pedido para descartar respuestas atrasadas de otra skill.
  const editRequest = useRef(0);
  const previewRequest = useRef(0);
  const historyRequest = useRef(0);

  // M10: la fecha del historial, con el formato del idioma activo (no la ISO cruda).
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }),
    [locale],
  );

  const bases = useMemo(() => skills.filter((s) => s.kind === 'repo'), [skills]);
  const baseSkill = bases.find((s) => s.name === base);
  const baseTools = baseSkill?.tools ?? [];

  const ordered = useMemo(
    () =>
      skills
        .map((skill, index) => ({ skill, index }))
        .sort((a, b) => groupOf(a.skill) - groupOf(b.skill) || a.index - b.index)
        .map((entry) => entry.skill),
    [skills],
  );

  // M7: un refresco que falla NO rompe el aviso de éxito; muestra aparte su propio texto.
  const refresh = useCallback(async () => {
    try {
      const items = await listSkillsWithTools();
      setSkills(items);
      setLoadError(null);
      return items;
    } catch {
      setLoadError(t('skills.error.cargar'));
      return null;
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    listSkillsWithTools()
      .then((items) => {
        if (cancelled) return;
        setSkills(items);
        // H-1: solo la primera carga que llega bien pone los valores por defecto; las
        // posteriores (otro idioma) actualizan la lista y no tocan `base` ni `tools`.
        if (defaultsApplied.current) return;
        defaultsApplied.current = true;
        const firstRepo = items.find((s) => s.kind === 'repo');
        if (firstRepo) {
          setBase(firstRepo.name);
          setTools(firstRepo.tools);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(t('skills.error.cargar'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  function resetForm() {
    // N4: cancelar invalida el pedido del detalle que esté en vuelo.
    editRequest.current += 1;
    setEditing(null);
    setEditLoading(false);
    setEditError(null);
    setName('');
    setDisplayName('');
    setDescription('');
    setInstructions('');
    setBase(bases[0]?.name ?? '');
    setTools(bases[0]?.tools ?? []);
    setFormError(null);
  }

  // M3: al editar se pide el DETALLE (`GET …/:name`) y el formulario se llena con él. Mientras
  // carga, o si falla, no se puede guardar, y el fallo se explica. M6: una respuesta atrasada
  // de otra skill se descarta.
  async function startEdit(skill: SkillWithTools) {
    const req = ++editRequest.current;
    setEditing(skill.name);
    setEditError(null);
    setEditLoading(true);
    setFormError(null);
    setNotice(null);
    setName(skill.name);
    setDisplayName(skill.display_name ?? skill.name);
    setDescription(skill.description ?? '');
    setBase(skill.base_skill ?? '');
    setInstructions('');
    setTools(skill.allowed_tools ?? skill.tools);
    try {
      const detail = await getSkill(skill.name);
      if (editRequest.current !== req) return;
      setName(detail.name);
      setDisplayName(detail.display_name ?? detail.name);
      setDescription(detail.description ?? '');
      setBase(detail.base_skill ?? '');
      setInstructions(detail.instructions ?? '');
      setTools(detail.allowed_tools ?? []);
    } catch (err) {
      if (editRequest.current !== req) return;
      // N5: un fallo de CARGA usa el texto de carga.
      setEditError(skillLoadErrorFrom(t, err));
    } finally {
      if (editRequest.current === req) setEditLoading(false);
    }
  }

  function handleBaseChange(next: string) {
    setBase(next);
    setTools(bases.find((s) => s.name === next)?.tools ?? []);
  }

  function toggleTool(tool: string) {
    setTools((prev) => (prev.includes(tool) ? prev.filter((item) => item !== tool) : [...prev, tool]));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitBusy.current) return;
    // M3: no se puede guardar mientras carga el detalle o si falló.
    if (editing !== null && (editLoading || editError !== null)) return;
    submitBusy.current = true;
    setFormError(null);
    setNotice(null);
    setSaving(true);
    try {
      if (editing) {
        // V1/A-5: el PATCH de edición NO manda `name` ni `base_skill` (400 field_read_only).
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
      submitBusy.current = false;
      setSaving(false);
    }
  }

  async function handleArchive(skill: SkillWithTools) {
    if (submitBusy.current) return;
    submitBusy.current = true;
    setFormError(null);
    setNotice(null);
    setSaving(true);
    try {
      await patchOrgSkill(skill.name, { status: 'archived' });
      setNotice(t('skills.notice.archived'));
      await refresh();
    } catch (err) {
      setFormError(skillErrorFrom(t, err));
    } finally {
      submitBusy.current = false;
      setSaving(false);
    }
  }

  async function handleRestore(skill: SkillWithTools) {
    if (submitBusy.current) return;
    submitBusy.current = true;
    setFormError(null);
    setNotice(null);
    setSaving(true);
    try {
      const updated = await patchOrgSkill(skill.name, { status: 'active' });
      // V2/A-5: el aviso sale del estado de la RESPUESTA (activa o borrador).
      setNotice(
        updated.status === 'draft'
          ? t('skills.notice.restored-draft')
          : t('skills.notice.restored-active'),
      );
      await refresh();
    } catch (err) {
      setFormError(skillErrorFrom(t, err));
    } finally {
      submitBusy.current = false;
      setSaving(false);
    }
  }

  // M6: la vista previa que no es de la skill actual se descarta. Devuelve `true` si cargó bien.
  async function loadPreview(skillName: string): Promise<boolean> {
    const req = ++previewRequest.current;
    setPreview(null);
    setPreviewError(null);
    setPreviewLoading(true);
    try {
      const p = await getPublishPreview(skillName);
      if (previewRequest.current !== req) return false;
      setPreview(p);
      return true;
    } catch (err) {
      if (previewRequest.current !== req) return false;
      const code = (err as { code?: string }).code;
      if (code === 'nothing_to_publish') {
        setPreviewError(t('skills.preview.nada'));
        await refresh();
      } else if (code === 'skill_archived') {
        setPreviewError(t('skills.preview.archivada'));
        await refresh();
      } else {
        // N5: un fallo de CARGA de la vista previa usa el texto de carga.
        setPreviewError(skillLoadErrorFrom(t, err));
      }
      return false;
    } finally {
      if (previewRequest.current === req) setPreviewLoading(false);
    }
  }

  async function openPublish(skill: SkillWithTools) {
    setPublishing(skill);
    setChangelog('');
    setPublishFieldError(null);
    setNotice(null);
    await loadPreview(skill.name);
  }

  function closePublish() {
    setPublishing(null);
    setPreview(null);
    setPreviewError(null);
    setPublishFieldError(null);
  }

  async function submitPublish() {
    if (!publishing || !preview) return;
    if (publishBusy.current) return;
    publishBusy.current = true;
    setPublishSaving(true);
    setPublishFieldError(null);
    setPreviewError(null);
    try {
      // A-5: se manda `expected_version` = la versión de la vista previa.
      await publishOrgSkill(publishing.name, {
        changelog: changelog || undefined,
        expected_version: preview.next_version,
      });
      setNotice(t('skills.notice.published'));
      closePublish();
      await refresh();
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'publish_conflict') {
        // A-5/F-2.10: pide otra vista previa, lo avisa y NO publica solo. Si la segunda vista
        // previa FALLA, se muestra SU error y no el de conflicto.
        const ok = await loadPreview(publishing.name);
        if (ok) setPreviewError(t('skills.preview.conflicto'));
      } else if (code === 'nothing_to_publish') {
        setPreviewError(t('skills.preview.nada'));
        await refresh();
      } else if (code === 'skill_archived') {
        setPreviewError(t('skills.preview.archivada'));
        await refresh();
      } else if (code === 'field_too_long') {
        // A-5: el error va en el campo.
        setPublishFieldError(skillErrorFrom(t, err));
      } else {
        setPreviewError(skillErrorFrom(t, err));
      }
    } finally {
      publishBusy.current = false;
      setPublishSaving(false);
    }
  }

  // M6/M12: el historial que no es de la skill actual se descarta; con error NO se muestra el
  // texto de vacío.
  async function openHistory(skill: SkillWithTools) {
    const req = ++historyRequest.current;
    setHistoryOf(skill);
    setVersions(null);
    setVersionsError(null);
    setNotice(null);
    setVersionsLoading(true);
    try {
      const res = await listSkillVersions(skill.name);
      if (historyRequest.current !== req) return;
      setVersions(res.versions);
    } catch (err) {
      if (historyRequest.current !== req) return;
      // N5: un fallo de CARGA del historial usa el texto de carga.
      setVersionsError(skillLoadErrorFrom(t, err));
      setVersions([]);
    } finally {
      if (historyRequest.current === req) setVersionsLoading(false);
    }
  }

  function closeHistory() {
    setHistoryOf(null);
    setVersions(null);
    setVersionsError(null);
  }

  const chars = countChars(instructions);
  const changelogChars = countChars(changelog);

  const actionBtn = 'text-sm disabled:opacity-40 disabled:cursor-not-allowed';
  // M12: mientras se publica, las acciones de la lista quedan deshabilitadas.
  const listBusy = saving || publishing !== null;
  // M3: no se puede guardar mientras carga el detalle o si falló.
  const editBlocked = editing !== null && (editLoading || editError !== null);
  // N4: mientras el detalle carga o falló, los campos están deshabilitados; «Cancelar» no.
  const formDisabled = saving || editBlocked;

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
      {formError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
          {formError}
        </div>
      )}
      {notice && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-300 text-sm">
          {notice}
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
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t("skills.estado")}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t("skills.version")}</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">{t("skills.acciones")}</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((skill) => (
                <tr
                  key={skill.name}
                  data-testid="skill-row"
                  data-name={skill.name}
                  data-kind={skill.kind}
                  data-state={skill.kind === 'repo' ? 'repo' : skill.status}
                  className="border-b border-gray-800 last:border-0"
                >
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
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {skill.kind === 'repo' ? (
                      <span className="text-gray-500">{t("skills.solo-lectura")}</span>
                    ) : (
                      <span data-testid="skill-state">
                        {t(stateKey(skill))}
                        {/* M9: «Cambios sin publicar» SOLO en las activas. */}
                        {skill.status === 'active' && skill.has_unpublished_changes
                          ? ` · ${t('skills.cambios-sin-publicar')}`
                          : ''}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {skill.kind === 'repo'
                      ? skill.latest_version
                      : skill.current_version ?? t('skills.sin-publicar')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {skill.kind === 'repo' ? (
                      <span className="text-xs text-gray-500">{t("skills.solo-lectura")}</span>
                    ) : (
                      <div className="flex items-center justify-end gap-3">
                        {skill.status === 'draft' && (
                          <>
                            <button type="button" onClick={() => startEdit(skill)} disabled={listBusy} className={`${actionBtn} text-blue-400 hover:text-blue-300`}>
                              {t("skills.editar")}
                            </button>
                            <button type="button" onClick={() => openPublish(skill)} disabled={listBusy} className={`${actionBtn} text-green-400 hover:text-green-300`}>
                              {t("skills.publicar")}
                            </button>
                            <button type="button" onClick={() => handleArchive(skill)} disabled={listBusy} className={`${actionBtn} text-red-400 hover:text-red-300`}>
                              {t("skills.archivar")}
                            </button>
                          </>
                        )}
                        {skill.status === 'active' && (
                          <>
                            <button type="button" onClick={() => startEdit(skill)} disabled={listBusy} className={`${actionBtn} text-blue-400 hover:text-blue-300`}>
                              {t("skills.editar")}
                            </button>
                            {skill.has_unpublished_changes && (
                              <button type="button" onClick={() => openPublish(skill)} disabled={listBusy} className={`${actionBtn} text-green-400 hover:text-green-300`}>
                                {t("skills.publicar")}
                              </button>
                            )}
                            <button type="button" onClick={() => openHistory(skill)} disabled={listBusy} className={`${actionBtn} text-gray-400 hover:text-gray-200`}>
                              {t("skills.historial")}
                            </button>
                            <button type="button" onClick={() => handleArchive(skill)} disabled={listBusy} className={`${actionBtn} text-red-400 hover:text-red-300`}>
                              {t("skills.archivar")}
                            </button>
                          </>
                        )}
                        {skill.status === 'archived' && (
                          <>
                            <button type="button" onClick={() => handleRestore(skill)} disabled={listBusy} className={`${actionBtn} text-green-400 hover:text-green-300`}>
                              {t("skills.restaurar")}
                            </button>
                            <button type="button" onClick={() => openHistory(skill)} disabled={listBusy} className={`${actionBtn} text-gray-400 hover:text-gray-200`}>
                              {t("skills.historial")}
                            </button>
                          </>
                        )}
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
          {editing ? t('skills.editando', { name: editing }) : t('skills.nueva')}
        </h2>

        <p className="text-sm text-gray-400">
          {editing ? t('skills.editar-ayuda') : t('skills.crear-ayuda')}
        </p>

        {/* M3: mientras carga el detalle se avisa; si falla, se explica y no se puede guardar. */}
        {editing && editLoading && (
          <div className="text-gray-400 text-sm">{t('skills.cargando-detalle')}</div>
        )}
        {editing && editError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
            {editError}
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
              disabled={formDisabled || editing !== null}
              placeholder={t("skills.mi-skill")}
            />
            {editing && <p className="text-xs text-gray-500 mt-1">{t("skills.campo-no-editable")}</p>}
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
              disabled={formDisabled || editing !== null}
            >
              {bases.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
            {editing && <p className="text-xs text-gray-500 mt-1">{t("skills.campo-no-editable")}</p>}
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
              disabled={formDisabled}
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
              disabled={formDisabled}
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
            disabled={formDisabled}
            aria-describedby="skill-instructions-help"
          />
          <p id="skill-instructions-help" className="text-xs text-gray-500 mt-1">
            {t("skills.instrucciones-ayuda")}
          </p>
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
                  disabled={formDisabled}
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
            disabled={saving || editBlocked}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium px-6 py-2 rounded-lg"
          >
            {saving ? t("skills.guardando") : t("skills.guardar")}
          </button>
        </div>
      </form>


      {publishing && (
        <Modal
          label={t('skills.publicar-titulo', { name: publishing.name })}
          title={t('skills.publicar-titulo', { name: publishing.name })}
          onClose={closePublish}
          closeDisabled={publishSaving}
        >
          {previewLoading && <div className="text-gray-400">{t('skills.preview.cargando')}</div>}
          {previewError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
              {previewError}
            </div>
          )}

          {preview && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">{t('skills.preview.version')}</div>
                  <div className="text-white font-mono" data-testid="preview-version">{preview.next_version}</div>
                </div>
                <div>
                  <div className="text-gray-500">{t('skills.preview.tipo')}</div>
                  <div className="text-white">{t(bumpKey(preview.bump))}</div>
                </div>
              </div>

              {preview.bump === 'major' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300">
                  {preview.agents_on_latest === 0
                    ? t('skills.major-aviso.cero')
                    : t('skills.major-aviso', { count: preview.agents_on_latest })}
                </div>
              )}

              <div className="space-y-1 text-sm text-gray-300">
                <div>
                  {t('skills.preview.tools-agregadas')}:{' '}
                  {preview.added_tools.length
                    ? capabilityPhrases(t, preview.added_tools).join(', ')
                    : t('skills.tools.ninguna')}
                </div>
                <div>
                  {t('skills.preview.tools-quitadas')}:{' '}
                  {preview.removed_tools.length
                    ? capabilityPhrases(t, preview.removed_tools).join(', ')
                    : t('skills.tools.ninguna')}
                </div>
                {preview.added_tools.length === 0 && preview.removed_tools.length === 0 && (
                  <div className="text-xs text-gray-500">{t('skills.preview.sin-tools')}</div>
                )}
              </div>

              <div>
                <label htmlFor="publish-changelog" className={labelCls}>
                  {t('skills.changelog')}{' '}
                  <span className="text-gray-500">
                    {t('skills.changelog-contador', { n: changelogChars })}
                  </span>
                </label>
                <textarea
                  id="publish-changelog"
                  rows={3}
                  className={inputCls}
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  disabled={publishSaving}
                  aria-invalid={!!publishFieldError}
                />
                {publishFieldError && <p className="text-xs text-red-400 mt-1">{publishFieldError}</p>}
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closePublish}
              disabled={publishSaving}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t('skills.cancelar')}
            </button>
            <button
              type="button"
              onClick={submitPublish}
              disabled={publishSaving || !preview}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-medium px-6 py-2 rounded-lg"
            >
              {t('skills.preview.publicar')}
            </button>
          </div>
        </Modal>
      )}


      {historyOf && (
        <Modal
          label={t('skills.historial-titulo', { name: historyOf.name })}
          title={t('skills.historial-titulo', { name: historyOf.name })}
          onClose={closeHistory}
        >
          {versionsLoading && <div className="text-gray-400">{t('skills.historial.cargando')}</div>}
          {versionsError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
              {versionsError}
            </div>
          )}

          {/* M12: con error NO se muestra el texto de vacío. */}
          {versions && versions.length === 0 && !versionsError && (
            <div className="text-gray-400">{t('skills.historial-vacia')}</div>
          )}

          {versions && versions.length > 0 && (
            <div className="space-y-3">
              {versions.map((v) => (
                <div
                  key={v.version}
                  data-testid="history-row"
                  data-version={v.version}
                  className="border border-gray-800 rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-mono">{`v${v.version}`}</span>
                      <span className="text-xs text-gray-400">{t(bumpKey(v.bump))}</span>
                      {v.version === historyOf.current_version && (
                        <span className="text-xs text-green-400">{t('skills.historial-vigente')}</span>
                      )}
                    </div>
                    {/* M10: la fecha con el formato del idioma activo, no la ISO cruda. */}
                    <span className="text-xs text-gray-500">{dateFmt.format(new Date(v.published_at))}</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    {t('skills.historial.notas')}: {v.changelog ?? '—'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {t('skills.historial.tools')}:{' '}
                    {v.allowed_tools.length
                      ? capabilityPhrases(t, v.allowed_tools).join(', ')
                      : t('skills.tools.ninguna')}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={closeHistory}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white"
            >
              {t('skills.cerrar')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

