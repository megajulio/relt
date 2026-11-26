'use client';

import { useEffect, useState } from 'react';
import { useDashboardAuth } from '@/components/dashboard/DashboardAuthProvider';
import { getToolsOverview, type ToolOverviewItem } from '@/lib/tools';
import { toolPhrase } from '@/lib/skill-labels';
import { useT } from '@/i18n/provider';

/**
 * ORDEN-65 · N6 (ANEXO-65-B · A-6) — `/dashboard/tools`, SOLO LECTURA.
 *
 * Por tool: la frase del mapa único de D5 (`@/lib/skill-labels`; si falta, la
 * frase de reserva con el nombre técnico), el nombre técnico, «Consulta» o
 * «Modifica datos», «Permitida» o «No permitida» para tu negocio y «La usan: …»
 * o «Ninguna skill la usa».
 *
 * «Permitida» = tu negocio tiene TODOS los permisos que pide la tool. No hay
 * ningún control para editar y no se muestran schemas ni handlers.
 */

type LoadState = 'loading' | 'error' | 'ready';

export default function ToolsPage() {
  const t = useT();
  useDashboardAuth();

  const [tools, setTools] = useState<ToolOverviewItem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');

  // Sin `t` en las dependencias: el idioma no vuelve a pedir el catálogo.
  useEffect(() => {
    let cancelled = false;
    getToolsOverview()
      .then((items) => {
        if (cancelled) return;
        setTools(items);
        setLoadState('ready');
      })
      .catch(() => {
        if (!cancelled) setLoadState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Reintentar: SOLO por acción del usuario. */
  async function reload() {
    setLoadState('loading');
    try {
      setTools(await getToolsOverview());
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{t('tools.title')}</h1>
        <p className="text-gray-400 mt-1">{t('tools.disclaimer')}</p>
      </div>

      {loadState === 'loading' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-400">
          {t('tools.loading')}
        </div>
      )}

      {loadState === 'error' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 space-y-3 text-sm text-red-300">
          <p>{t('tools.load-error')}</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700"
          >
            {t('tools.retry')}
          </button>
        </div>
      )}

      {loadState === 'ready' && tools.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-sm text-gray-400">
          {t('agents.tools.no-hay-tools-registradas-en-la-plataforma')}
        </div>
      )}

      {loadState === 'ready' && tools.length > 0 && (
        <div className="space-y-3">
          {tools.map((tool) => (
            <div
              key={tool.name}
              data-testid="tool-row"
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm font-medium text-gray-200">{toolPhrase(t, tool.name)}</div>
                <span className="text-xs text-gray-500 font-mono">{tool.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 text-xs">
                  {tool.access === 'read' ? t('tools.access.read') : t('tools.access.write')}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                    tool.allowed
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-gray-700/50 text-gray-300'
                  }`}
                >
                  {tool.allowed ? t('tools.allowed') : t('tools.not-allowed')}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                {tool.skills.length === 0
                  ? t('tools.none')
                  : t('tools.used-by', {
                      skills: tool.skills
                        .map((skill) =>
                          skill.permitted
                            ? skill.display_name
                            : `${skill.display_name} ${t('tools.skill-blocked')}`,
                        )
                        .join(', '),
                    })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
