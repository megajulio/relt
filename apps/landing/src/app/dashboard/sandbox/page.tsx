'use client';

import Link from 'next/link';
import { useDashboardAuth } from '@/components/dashboard/DashboardAuthProvider';
import { ChannelWithoutAgentNotice } from '@/components/dashboard/ChannelWithoutAgentNotice';
import { useSandboxQR } from '@/lib/use-sandbox-qr';
import { useSandboxConnection } from '@/lib/use-sandbox-connection';
import { useSandboxStatus } from '@/lib/use-sandbox-status';
import { useUnassignedChannels } from '@/lib/use-unassigned-channels';
import { D2_CONFLICT_TEXT, isD2Conflict } from '@/lib/orden49';

export default function SandboxPage() {
  const { data: authData } = useDashboardAuth();

  const orgId = authData.organizations[0]?.id;

  const { data, loading, error, refresh } = useSandboxQR(orgId);
  const {
    data: connection,
    loading: connectionLoading,
    error: connectionError,
    refresh: refreshConnection,
  } = useSandboxConnection(orgId);

  // Orden #49 · D2: el sandbox rechazado por número ya activo en otra cuenta.
  const { data: sandboxStatus } = useSandboxStatus(orgId);
  const d2Conflict = isD2Conflict(sandboxStatus);

  // Orden #49 · D5: canales conectados sin agente, con la acción de asignar.
  const unassigned = useUnassignedChannels(orgId);

  async function handleAssigned() {
    await unassigned.refresh();
    await refresh();
    await refreshConnection();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500 mb-2">
            <Link
              href="/dashboard"
              className="hover:text-gray-300 transition-colors"
            >
              Dashboard
            </Link>
            <span className="mx-2">/</span>
            <span>Sandbox</span>
          </div>

          <h1 className="text-3xl font-bold text-white">
            WhatsApp Sandbox
          </h1>

          <p className="text-gray-400 mt-1">
            Connect your WhatsApp account to start testing your Agent.
          </p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        {loading && (
          <div className="space-y-4">
            <div className="h-5 bg-gray-800 rounded w-1/3 animate-pulse" />
            <div className="h-3 bg-gray-800 rounded w-2/3 animate-pulse" />
            <div className="mx-auto mt-6 w-[320px] h-[320px] bg-gray-800 rounded-xl animate-pulse" />
          </div>
        )}

        {!loading && error && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Unable to load QR code
              </h2>
              <p className="text-sm text-red-400 mt-2">{error}</p>
            </div>

            <button
              onClick={refresh}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {d2Conflict && (
          <div className="text-center py-8" data-testid="d2-sandbox-conflict">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-400/10 text-red-300">
              <span className="text-2xl">!</span>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-300">
              NUMBER ALREADY IN USE
            </div>

            <h2 className="mt-4 text-xl font-semibold text-white">
              This number is already connected to another RELT account
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-300">
              {D2_CONFLICT_TEXT}
            </p>

            <button
              onClick={async () => {
                await refresh();
                await refreshConnection();
              }}
              className="mt-6 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              Check again
            </button>
          </div>
        )}

        {!d2Conflict && unassigned.channels.length > 0 && (
          <div className="mb-6 space-y-3">
            {unassigned.channels.map((channel) => (
              <ChannelWithoutAgentNotice
                key={channel.id}
                channel={channel}
                agentId={unassigned.singleActiveAgent?.id ?? null}
                onAssigned={handleAssigned}
                testId="d5-notice-sandbox"
              />
            ))}
          </div>
        )}

        {!d2Conflict && !loading && !error && data?.status === 'not_provisioned' && (
          <div className="text-center py-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-400/10 text-blue-300">
              <span className="text-2xl">＋</span>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-300">
              SANDBOX NOT PROVISIONED
            </div>

            <h2 className="mt-4 text-xl font-semibold text-white">
              Your sandbox is not provisioned yet
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-400">
              Create your first Agent and RELT will automatically provision your
              WhatsApp sandbox for testing.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard/agents/new"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Create your first Agent
                <span aria-hidden="true">→</span>
              </Link>

              <button
                onClick={refresh}
                className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                Check again
              </button>
            </div>
          </div>
        )}

        {!d2Conflict && !connectionLoading && connection?.state === 'connected' && (
          <div className="text-center py-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
              <span className="text-2xl">✓</span>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              CONNECTED
            </div>

            <h2 className="mt-4 text-xl font-semibold text-white">
              WhatsApp sandbox connected
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-400">
              Your WhatsApp account is connected and ready to test your Agent.
            </p>

            {connection.instance_name && (
              <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-left">
                <p className="text-xs uppercase tracking-[0.14em] text-gray-500">
                  Sandbox instance
                </p>
                <p className="mt-1 font-mono text-sm text-gray-300 break-all">
                  {connection.instance_name}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard/agents"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Create your first Agent
                <span aria-hidden="true">→</span>
              </Link>

              <button
                onClick={refresh}
                className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-gray-300 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              >
                Refresh status
              </button>
            </div>
          </div>
        )}

        {!d2Conflict &&
          !connectionLoading &&
          (connection?.state === 'qr_required' || connection?.state === 'connecting') &&
          !error &&
          data?.qr_base64 && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-green-400 text-sm font-medium mb-4">
              <span>●</span>
              Sandbox ready
            </div>

            <h2 className="text-xl font-semibold text-white">
              Scan this QR code with WhatsApp
            </h2>

            <p className="text-sm text-gray-400 mt-2">
              Open WhatsApp on your phone and scan this code to connect
              your sandbox.
            </p>

            <div className="mt-6 inline-flex rounded-2xl bg-white p-4">
              <img
                src={data.qr_base64}
                alt="WhatsApp sandbox QR code"
                className="block w-[320px] h-[320px]"
              />
            </div>

            {data.message && (
              <p className="text-xs text-gray-500 mt-4">
                {data.message}
              </p>
            )}

            {connection.instance_name && (
              <p className="text-xs text-gray-600 mt-2 font-mono">
                {connection.instance_name}
              </p>
            )}

            <button
              onClick={refresh}
              className="mt-5 text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              Refresh QR
            </button>
          </div>
        )}

        {!d2Conflict &&
          !connectionLoading &&
          !connectionError &&
          connection?.state === 'disconnected' && (
          <div className="text-center py-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-300">
              <span className="text-2xl">!</span>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
              WHATSAPP DISCONNECTED
            </div>

            <h2 className="mt-4 text-xl font-semibold text-white">
              WhatsApp is disconnected
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-400">
              Your sandbox is still active. Reconnect WhatsApp to continue testing your Agent.
            </p>

            <button
              onClick={async () => {
                await refresh();
                await refreshConnection();
              }}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Reconnect WhatsApp
            </button>
          </div>
        )}

        {!d2Conflict &&
          !loading &&
          !error &&
          !data?.qr_base64 &&
          data?.status === 'no_qr_available' && (
            <div className="text-center py-8">
              <div className="text-green-400 text-3xl mb-3">✓</div>

              <h2 className="text-xl font-semibold text-white">
                WhatsApp connection is not waiting for a QR
              </h2>

              <p className="text-sm text-gray-400 mt-2">
                The sandbox may already be connected.
              </p>

              <button
                onClick={refresh}
                className="mt-5 text-sm bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Check again
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
