'use client';

import { Fragment, useEffect, useState } from 'react';
import { useDashboardAuth } from '@/components/dashboard/DashboardAuthProvider';
import {
  getPlatformClients,
  LAST_STEPS,
  type PlatformClientRow,
  type PlatformClientsOverview,
} from '@/lib/platform';

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

function StepBadge({ step }: { step: string }) {
  const cls = STEP_STYLES[step] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  return (
    <span className={`inline-block whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {step}
    </span>
  );
}

function NumbersCell({ row }: { row: PlatformClientRow }) {
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
              DUPLICADO · {n.duplicateWith.join(', ')}
            </span>
          )}
          {!n.hasActiveBinding && (
            <span className="ml-2 rounded border border-yellow-500/40 bg-yellow-500/10 px-1.5 py-0.5 text-xs text-yellow-300">
              va al legacy
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function StepsGrid({ row }: { row: PlatformClientRow }) {
  return (
    <div className="sm:col-span-2 lg:col-span-3">
      <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">
        Recorrido · estado actual (hoy)
      </div>
      <div className="flex flex-wrap gap-2">
        {LAST_STEPS.map((step) => {
          const ok = row.steps?.[step] === true;
          return (
            <span
              key={step}
              className={`rounded-md border px-2 py-1 text-xs font-medium ${
                ok
                  ? 'border-green-500/40 bg-green-500/10 text-green-300'
                  : 'border-gray-700 bg-gray-800 text-gray-400'
              }`}
              title={ok ? 'cumplido hoy' : 'no cumplido hoy'}
            >
              {ok ? '✓' : '✗'} {step}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Detail({ row }: { row: PlatformClientRow }) {
  const items: Array<[string, string]> = [
    ['Organización', `${row.organizationName} (${row.organizationId})`],
    ['Alta', fmt(row.organizationCreatedAt)],
    ['Correo del dueño', row.ownerEmail || '—'],
    ['Plan', row.plan],
    ['Trial desde', fmt(row.trialStartedAt)],
    ['Trial hasta', fmt(row.trialExpiresAt)],
    ['Sandbox', `${row.sandbox.status || '—'} · intentos ${row.sandbox.attempts}`],
    ['Último error del sandbox', row.sandbox.lastErrorCode || '—'],
    ['Instancia', row.sandbox.instanceName || '—'],
    ['Agentes', `${row.agents.total} (${row.agents.active} activos)`],
    ['Primer entrante', fmt(row.activity.firstInboundAt)],
    ['Último entrante', fmt(row.activity.lastInboundAt)],
    ['Entrantes 7d', String(row.activity.inbound7d)],
    ['Ejecuciones 7d', String(row.activity.executions7d)],
    ['Ejecuciones con error 7d', String(row.activity.executionsFailed7d)],
    ['Inbox FAILED', String(row.activity.inboxFailed)],
    ['Inbox RECEIVED > 1 h', String(row.activity.inboxReceivedOver1h)],
    ['Último paso (hoy)', row.lastStep],
    ['Primera respuesta (histórico)', row.firstReplyAt ? fmt(row.firstReplyAt) : 'nunca'],
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
          Loading platform clients…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl space-y-4">
        <h1 className="text-3xl font-bold text-white">Platform · Clients</h1>
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
          <h1 className="text-3xl font-bold text-white">Platform · Clients</h1>
          <p className="mt-1 text-gray-400">
            Internal view of every organization, its channels and how far it got in onboarding.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            <span className="font-medium text-gray-400">Estado actual</span> = recorrido consecutivo de hoy ·{' '}
            <span className="font-medium text-gray-400">Histórico</span> = primera respuesta enviada alguna vez
          </p>
        </div>
        <span className="rounded-md border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300">
          Read-only
        </span>
      </div>

      {data?.truncated && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          Mostrando las primeras {clients.length} de {data.totalOrganizations} organizaciones (tope duro de 500).
        </div>
      )}

      {totals && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Organizations</div>
              <div className="text-2xl font-semibold text-white">{totals.organizations}</div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Duplicated numbers</div>
              <div className={`text-2xl font-semibold ${totals.duplicates > 0 ? 'text-red-400' : 'text-white'}`}>
                {totals.duplicates}
              </div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Channels going legacy</div>
              <div className={`text-2xl font-semibold ${totals.legacyChannels > 0 ? 'text-yellow-400' : 'text-white'}`}>
                {totals.legacyChannels}
              </div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Reached first reply</div>
              <div className="text-2xl font-semibold text-white">{totals.funnel['primera respuesta'] ?? 0}</div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <div className="mb-3 text-xs uppercase tracking-wide text-gray-500">Onboarding funnel</div>
            <div className="flex flex-wrap gap-3">
              {LAST_STEPS.map((step) => (
                <div key={step} className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2">
                  <div className="text-xs text-gray-400">{step}</div>
                  <div className="text-lg font-semibold text-white">{totals.funnel[step] ?? 0}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {clients.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-400">
          No organizations yet.
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
                      <div className="text-xs text-gray-500">trial: {fmt(row.trialExpiresAt)}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      <div>{row.sandbox.status || '—'}</div>
                      <div className="text-xs text-gray-500">
                        {row.sandbox.attempts} intento(s)
                        {row.sandbox.lastErrorCode ? ` · ${row.sandbox.lastErrorCode}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <NumbersCell row={row} />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      {row.agents.total} <span className="text-xs text-gray-500">({row.agents.active} activos)</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      <div>in {row.activity.inbound7d}</div>
                      <div className="text-xs text-gray-500">
                        exec {row.activity.executions7d} · err {row.activity.executionsFailed7d}
                      </div>
                      <div className="text-xs text-gray-500">
                        inbox FAILED {row.activity.inboxFailed} · &gt;1h {row.activity.inboxReceivedOver1h}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StepBadge step={row.lastStep} />
                      {row.firstReplyAt && (
                        <div className="mt-1 text-xs text-gray-500">histórico: {fmt(row.firstReplyAt)}</div>
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

