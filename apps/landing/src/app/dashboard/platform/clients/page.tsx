'use client';

import { Fragment, useEffect, useState } from 'react';
import { useDashboardAuth } from '@/components/dashboard/DashboardAuthProvider';
import {
  FIRST_REPLY_RULE_KEY,
  FIRST_REPLY_STEP,
  firstReplyLabel,
  firstReplyRule,
  getPlatformClients,
  LAST_STEPS,
  stepLabel,
  type FirstReplySource,
  type PlatformClientRow,
  type PlatformClientsOverview,
} from '@/lib/platform';
import { useT } from '@/i18n/provider';

/**
 * Orden #47 · Panel interno del dueño (v1, SOLO LECTURA).
 *
 * Una fila por organización con agregados y campos enmascarados. No hay ningún
 * botón que cambie datos: al hacer clic en una fila se ve su detalle.
 */

const STEP_STYLES: Record<string, string> = {
  registrada: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'sandbox listo': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'número conectado': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'agente creado': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'canal con agente': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'primera respuesta': 'bg-green-500/20 text-green-300 border-green-500/30',
};

function fmt(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

function StepBadge({ step, source }: { step: string; source?: FirstReplySource }) {
  const t = useT();
  const cls = STEP_STYLES[step] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${cls}`}
      title={step === FIRST_REPLY_STEP ? firstReplyRule(t, source) : undefined}
    >
      {stepLabel(t, step, source)}
    </span>
  );
}

function NumbersCell({ row }: { row: PlatformClientRow }) {
  const t = useT();
  if (row.numbers.length === 0) return <span className="text-sm text-gray-500">—</span>;
  return (
    <div className="space-y-1">
      {row.numbers.map((n, i) => (
        <div key={`${n.masked}-${i}`} className="text-sm">
          <span className="font-mono text-gray-200">{n.masked}</span>
          <span className="ml-2 text-xs text-gray-500">{n.provider || '—'}</span>
          <span className="ml-2 text-xs text-gray-400">{n.status || '—'}</span>
          {n.duplicateWith && n.duplicateWith.length > 0 && (
            <span
              className="ml-2 rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-xs text-red-300"
              title={`Mismo número también en: ${n.duplicateWith.join(', ')}`}
            >
              {t("platform.duplicado")} {n.duplicateWith.join(', ')}
            </span>
          )}
          {!n.hasActiveBinding && (
            <span className="ml-2 rounded border border-yellow-500/40 bg-yellow-500/10 px-1.5 py-0.5 text-xs text-yellow-300">
              {t("platform.va-al-legacy")}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function StepsGrid({ row }: { row: PlatformClientRow }) {
  const t = useT();
  return (
    <div className="sm:col-span-2 lg:col-span-3">
      <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">
        {t("platform.recorrido-estado-actual-hoy")}
      </div>
      <div className="flex flex-wrap gap-2">
        {LAST_STEPS.map((step) => {
          const ok = row.steps?.[step] === true;
          const isFirstReply = step === FIRST_REPLY_STEP;
          return (
            <span
              key={step}
              className={`rounded-md border px-2 py-1 text-xs font-medium ${
                ok
                  ? 'border-green-500/40 bg-green-500/10 text-green-300'
                  : 'border-gray-700 bg-gray-800 text-gray-400'
              }`}
              title={
                isFirstReply
                  ? firstReplyRule(t, row.firstReplySource)
                  : ok
                    ? t('platform.step.doneToday')
                    : t('platform.step.notDoneToday')
              }
            >
              {ok ? '✓' : '✗'} {stepLabel(t, step, row.firstReplySource)}
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {t("platform.primera-respuesta-inferida")} {t(FIRST_REPLY_RULE_KEY)}
      </p>
    </div>
  );
}

function Detail({ row }: { row: PlatformClientRow }) {
  const t = useT();
  // Orden #62 · ANEXO-62-A (D3): las etiquetas son claves del catálogo.
  const items: Array<[string, string]> = [
    [t('platform.detail.organization'), `${row.organizationName} (${row.organizationId})`],
    [t('platform.detail.createdAt'), fmt(row.organizationCreatedAt)],
    [t('platform.detail.ownerEmail'), row.ownerEmail || '—'],
    [t('platform.detail.plan'), row.plan],
    [t('platform.detail.trialFrom'), fmt(row.trialStartedAt)],
    [t('platform.detail.trialTo'), fmt(row.trialExpiresAt)],
    [
      t('platform.detail.sandbox'),
      `${row.sandbox.status || '—'} · ${t('platform.detail.attempts')} ${row.sandbox.attempts}`,
    ],
    [t('platform.detail.lastSandboxError'), row.sandbox.lastErrorCode || '—'],
    [t('platform.detail.instance'), row.sandbox.instanceName || '—'],
    [
      t('platform.detail.agents'),
      `${row.agents.total} (${row.agents.active} ${t('platform.detail.activePlural')})`,
    ],
    [t('platform.detail.firstInbound'), fmt(row.activity.firstInboundAt)],
    [t('platform.detail.lastInbound'), fmt(row.activity.lastInboundAt)],
    [t('platform.detail.inbound7d'), String(row.activity.inbound7d)],
    [t('platform.detail.executions7d'), String(row.activity.executions7d)],
    [t('platform.detail.executionsFailed7d'), String(row.activity.executionsFailed7d)],
    [t('platform.detail.inboxFailed'), String(row.activity.inboxFailed)],
    [t('platform.detail.inboxReceivedOver1h'), String(row.activity.inboxReceivedOver1h)],
    [t('platform.detail.lastStepToday'), stepLabel(t, row.lastStep, row.firstReplySource)],
    [
      row.firstReplySource === 'link'
        ? t('platform.detail.firstReplyLink')
        : t('platform.detail.firstReplyInferred'),
      row.firstReplyAt ? fmt(row.firstReplyAt) : t('platform.detail.never'),
    ],
  ];
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-2 bg-gray-950/60 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label}>
          <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
          <div className="text-sm text-gray-200 break-words">{value}</div>
        </div>
      ))}
      <StepsGrid row={row} />
    </div>
  );
}

export default function PlatformClientsPage() {
  const t = useT();
  useDashboardAuth();

  const [data, setData] = useState<PlatformClientsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    getPlatformClients()
      .then(setData)
      .catch((err) => setError(err.message || 'Error loading platform clients'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-400">
          {t("platform.loading-platform-clients")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl space-y-4">
        <h1 className="text-3xl font-bold text-white">{t("platform.platform-clients")}</h1>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
          <div className="mb-1 font-medium text-red-400">
            {error.toLowerCase().includes('forbidden') || error.includes('403')
              ? 'Not authorized'
              : 'Error'}
          </div>
          <div className="text-sm text-red-300">{error}</div>
        </div>
      </div>
    );
  }

  const clients = data?.clients ?? [];
  const totals = data?.totals;

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("platform.platform-clients")}</h1>
          <p className="mt-1 text-gray-400">
            {t("platform.internal-view-of-every-organization-its-channels-and-how")}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            <span className="font-medium text-gray-400">{t("platform.estado-actual")}</span> {t("platform.recorrido-consecutivo-de-hoy")}{' '}
            <span className="font-medium text-gray-400">{t("platform.historico")}</span> {t("platform.primera-respuesta-por-vinculo-si-existe-inferida-si-es-a")}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {t("platform.primera-respuesta-inferida")} {t(FIRST_REPLY_RULE_KEY)}
          </p>
        </div>
        <span className="rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300">
          {t("platform.read-only")}
        </span>
      </div>

      {data?.truncated && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          {t("platform.mostrando-las-primeras")} {clients.length} {t("platform.de")} {data.totalOrganizations} {t("platform.organizaciones-tope-duro-de-500")}
        </div>
      )}

      {totals && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">{t("platform.organizations")}</div>
              <div className="text-2xl font-semibold text-white">{totals.organizations}</div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">{t("platform.duplicated-numbers")}</div>
              <div className={`text-2xl font-semibold ${totals.duplicates > 0 ? 'text-red-400' : 'text-white'}`}>
                {totals.duplicates}
              </div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">{t("platform.channels-going-legacy")}</div>
              <div className={`text-2xl font-semibold ${totals.legacyChannels > 0 ? 'text-yellow-400' : 'text-white'}`}>
                {totals.legacyChannels}
              </div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">{t("platform.reached-first-reply-inferred")}</div>
              <div className="text-2xl font-semibold text-white">{totals.funnel['primera respuesta'] ?? 0}</div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="mb-3 text-xs uppercase tracking-wide text-gray-500">{t("platform.onboarding-funnel")}</div>
            <div className="flex flex-wrap gap-3">
              {LAST_STEPS.map((step) => (
                <div key={step} className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2">
                  <div className="text-xs text-gray-400">{stepLabel(t, step)}</div>
                  <div className="text-lg font-semibold text-white">{totals.funnel[step] ?? 0}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {clients.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-400">
          {t("platform.no-organizations-yet")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {['Organization', 'Owner', 'Plan', 'Sandbox', 'Numbers', 'Agents', 'Activity 7d', 'Last step (today)'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {clients.map((row) => (
                <Fragment key={row.organizationId}>
                  <tr
                    key={row.organizationId}
                    data-testid={`client-row-${row.organizationId}`}
                    onClick={() => setOpenId(openId === row.organizationId ? null : row.organizationId)}
                    className="cursor-pointer border-b border-gray-800 last:border-0 hover:bg-gray-800/30"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-white">{row.organizationName}</div>
                      <div className="text-xs text-gray-500">{fmt(row.organizationCreatedAt)}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">{row.ownerEmail || '—'}</td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      <div>{row.plan}</div>
                      <div className="text-xs text-gray-500">{t("platform.trial")} {fmt(row.trialExpiresAt)}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      <div>{row.sandbox.status || '—'}</div>
                      <div className="text-xs text-gray-500">
                        {row.sandbox.attempts} {t("platform.intento-s")}
                        {row.sandbox.lastErrorCode ? ` · ${row.sandbox.lastErrorCode}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <NumbersCell row={row} />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      {row.agents.total} <span className="text-xs text-gray-500">({row.agents.active} {t("platform.activos")}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      <div>{t("platform.in")} {row.activity.inbound7d}</div>
                      <div className="text-xs text-gray-500">
                        {t("platform.exec")} {row.activity.executions7d} {t("platform.err")} {row.activity.executionsFailed7d}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t("platform.inbox-failed")} {row.activity.inboxFailed} {t("platform.gt-1h")} {row.activity.inboxReceivedOver1h}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StepBadge step={row.lastStep} source={row.firstReplySource} />
                      {row.firstReplyAt && (
                        <div
                          data-testid="first-reply-datum"
                          className="mt-1 text-xs text-gray-500"
                          title={firstReplyRule(t, row.firstReplySource)}
                        >
                          {firstReplyLabel(t, row.firstReplySource)}: {fmt(row.firstReplyAt)}
                        </div>
                      )}
                    </td>
                  </tr>
                  {openId === row.organizationId && (
                    <tr className="border-b border-gray-800 last:border-0">
                      <td colSpan={8} className="p-0">
                        <Detail row={row} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

