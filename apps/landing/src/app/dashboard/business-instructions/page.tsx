'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDashboardAuth } from '@/components/dashboard/DashboardAuthProvider';
import {
  getBusinessInstructions,
  putBusinessInstructions,
  type BusinessInstructions,
} from '@/lib/business-instructions';
import { countChars, hasTemplateMarkers, MAX_ORG_INSTRUCTIONS } from '@/lib/count-chars';
import { useT } from '@/i18n/provider';

/**
 * ORDEN-65 · N5 (ANEXO-65-B) — `/dashboard/business-instructions`.
 *
 * Un solo texto por organización, con contador `n/8000` (`countChars`), «Usar
 * plantilla» (solo con el texto vacío y SIN guardar) y revisión optimista:
 *
 * - si el `GET` falla, NO hay editor ni «Guardar»: un mensaje y «Reintentar»;
 * - con 409 no se pierde lo escrito y NO se reintenta solo; se ofrece cargar la
 *   versión guardada;
 * - después de guardar se usa la `revision` de la RESPUESTA (dos guardados
 *   seguidos no dan 409);
 * - si `can_edit` es `false`, solo lectura;
 * - el efecto de carga NO depende de `t`: cambiar de idioma no recarga ni pisa
 *   lo que se está escribiendo (lección P1 de la #64).
 */

const inputCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500';

type LoadState = 'loading' | 'error' | 'ready';

export default function BusinessInstructionsPage() {
  const t = useT();
  useDashboardAuth();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [content, setContent] = useState('');
  const [revision, setRevision] = useState(0);
  const [canEdit, setCanEdit] = useState(false);
  const [maxLength, setMaxLength] = useState(MAX_ORG_INSTRUCTIONS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  // Sin `t` en las dependencias: el idioma no es motivo de recarga (T65-14).
  const applyView = useCallback((view: BusinessInstructions) => {
    setContent(view.content);
    setRevision(view.revision);
    setCanEdit(view.can_edit === true);
    setMaxLength(
      typeof view.max_length === 'number' && view.max_length > 0
        ? view.max_length
        : MAX_ORG_INSTRUCTIONS,
    );
    setLoadState('ready');
  }, []);

  useEffect(() => {
    let cancelled = false;
    getBusinessInstructions()
      .then((view) => {
        if (!cancelled) applyView(view);
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [applyView]);

  /** Reintentar / cargar la versión guardada: SOLO por acción del usuario. */
  async function reload() {
    setLoadState('loading');
    setConflict(false);
    setSaveError(null);
    setSaved(false);
    try {
      applyView(await getBusinessInstructions());
    } catch {
      setLoadState('error');
    }
  }

  const chars = countChars(content);
  const over = chars > maxLength;
  const showMarkers = hasTemplateMarkers(content);

  async function handleSave() {
    setSaveError(null);
    setConflict(false);
    setSaved(false);
    setSaving(true);
    try {
      const view = await putBusinessInstructions(content, revision);
      setContent(view.content);
      // A-5: el panel usa la revisión de la RESPUESTA.
      setRevision(view.revision);
      setCanEdit(view.can_edit === true);
      setSaved(true);
    } catch (err: unknown) {
      const status = (err as { status?: number } | undefined)?.status;
      if (status === 409) {
        // Conflict: se conserva lo escrito y NO se reintenta solo.
        setConflict(true);
      } else {
        setSaveError(t('business.instructions.save-error'));
      }
    } finally {
      setSaving(false);
    }
  }

  function handleUseTemplate() {
    setContent(t('business.org-template'));
    setSaved(false);
    setSaveError(null);
    setConflict(false);
  }


  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{t('business.instructions.title')}</h1>
        <p className="text-gray-400 mt-1">{t('business.instructions.help')}</p>
      </div>

      {loadState === 'loading' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-400">
          {t('business.instructions.loading')}
        </div>
      )}

      {loadState === 'error' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 space-y-3 text-sm text-red-300">
          <p>{t('business.instructions.load-error')}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700"
          >
            {t('business.instructions.retry')}
          </button>
        </div>
      )}

      {loadState === 'ready' && !canEdit && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
          <p className="text-sm text-amber-300">{t('business.instructions.read-only')}</p>
          <label htmlFor="org-business-instructions" className="block text-sm text-gray-400">
            {t('business.instructions.title')}
          </label>
          <textarea
            id="org-business-instructions"
            rows={10}
            className={inputCls}
            value={content}
            readOnly
          />
        </div>
      )}

      {loadState === 'ready' && canEdit && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="org-business-instructions" className="text-sm text-gray-400">
                {t('business.instructions.title')}
              </label>
              <span className={over ? 'text-xs text-red-400' : 'text-xs text-gray-500'}>
                {chars}/{maxLength}
              </span>
            </div>
            <textarea
              id="org-business-instructions"
              rows={10}
              className={inputCls}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={saving}
            />
            {showMarkers && (
              <div className="text-xs text-amber-400 mt-1">
                {t('business.completa-los-datos-entre-corchetes')}
              </div>
            )}
          </div>

          {saved && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-300">
              {t('business.instructions.saved')}
            </div>
          )}

          {conflict && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-2 text-sm text-amber-300">
              <p>{t('business.instructions.conflict')}</p>
              <button
                type="button"
                onClick={() => void reload()}
                className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-gray-700"
              >
                {t('business.instructions.conflict-load')}
              </button>
            </div>
          )}

          {saveError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
              {saveError}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <div>
              {content.trim() === '' && (
                <button
                  type="button"
                  onClick={handleUseTemplate}
                  disabled={saving}
                  className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700 disabled:opacity-40"
                >
                  {t('business.instructions.use-template')}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || over}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? t('business.instructions.saving') : t('business.instructions.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

