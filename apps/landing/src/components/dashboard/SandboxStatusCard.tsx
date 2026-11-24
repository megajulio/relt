'use client';

import { useSandboxStatus } from '@/lib/use-sandbox-status';
import { D2_CONFLICT_TEXT, isD2Conflict } from '@/lib/orden49';
import { useT } from '@/i18n/provider';

interface SandboxStatusCardProps {
  orgId: string | undefined;
  connected?: boolean;
}

export function SandboxStatusCard({
  orgId,
  connected = false,
}: SandboxStatusCardProps) {
  const t = useT();
  const { data, loading, error, retrying, retry } = useSandboxStatus(orgId);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-gray-800 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-gray-800 rounded w-1/3 animate-pulse" />
            <div className="h-3 bg-gray-800 rounded w-1/2 mt-2 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 border border-red-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="text-red-400 text-xl">⚠</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{t("dashboard.sandbox.error-loading-sandbox")}</h3>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado: null (sin fila) → "Activate your sandbox"
  if (!data || data.status === null) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="text-blue-400 text-xl">◌</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{t("dashboard.sandbox.whatsapp-sandbox")}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {t("dashboard.sandbox.your-sandbox-is-not-yet-provisioned-this-will-happen-aut")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Estado: pending / provisioning → "Setting up your sandbox"
  if (data.status === 'pending' || data.status === 'provisioning') {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="text-yellow-400 text-xl animate-spin">◌</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{t("dashboard.sandbox.whatsapp-sandbox")}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {t("dashboard.sandbox.setting-up-your-sandbox")}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {t("dashboard.sandbox.this-usually-takes-a-moment-the-page-will-update-automat")}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="text-xs text-gray-500">
                {t("dashboard.sandbox.attempt")} {data.attempts}
              </div>
              {data.instance_name && (
                <div className="text-xs text-gray-600">
                  · {data.instance_name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado: connected → WhatsApp conectado
  if (connected) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="text-green-400 text-xl">●</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{t("dashboard.sandbox.whatsapp-sandbox")}</h3>

            <p className="text-sm text-gray-400 mt-1">
              <span className="text-green-400 font-medium">{t("dashboard.sandbox.connected")}</span>
            </p>

            <p className="text-sm text-gray-400 mt-2">
              {t("dashboard.sandbox.whatsapp-is-connected-and-ready-to-test-your-agent")}
            </p>

            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span>{t("dashboard.sandbox.evolution-sandbox")}</span>
              {data.instance_name && (
                <>
                  <span>·</span>
                  <span>{data.instance_name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado: ready → sandbox provisionado, WhatsApp aún no conectado
  if (data.status === 'ready') {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="text-yellow-400 text-xl">●</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{t("dashboard.sandbox.whatsapp-sandbox")}</h3>

            <p className="text-sm text-gray-400 mt-1">
              <span className="text-yellow-400 font-medium">{t("dashboard.sandbox.ready-to-connect")}</span>
            </p>

            <p className="text-sm text-gray-400 mt-2">
              {t("dashboard.sandbox.your-sandbox-is-provisioned-connect-whatsapp-to-start-te")}
            </p>

            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span>{t("dashboard.sandbox.evolution-sandbox")}</span>
              {data.instance_name && (
                <>
                  <span>·</span>
                  <span>{data.instance_name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado: rechazo de D2 (el número ya está activo en otra cuenta de RELT)
  if (isD2Conflict(data)) {
    return (
      <div className="bg-gray-900 border border-red-800 rounded-xl p-6" data-testid="d2-sandbox-status">
        <div className="flex items-start gap-3">
          <div className="text-red-400 text-xl">⚠</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{t("dashboard.sandbox.whatsapp-sandbox")}</h3>
            <p className="text-sm text-gray-300 mt-1">{D2_CONFLICT_TEXT}</p>
            <p className="text-xs text-gray-500 mt-2">
              {t("dashboard.sandbox.this-sandbox-cannot-connect-whatsapp-until-the-number-is")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Estado: failed → "⚠ Setup failed" + Retry button
  if (data.status === 'failed') {
    return (
      <div className="bg-gray-900 border border-red-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="text-red-400 text-xl">⚠</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{t("dashboard.sandbox.whatsapp-sandbox")}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {t("dashboard.sandbox.setup-failed")}
            </p>
            {data.last_error && (
              <p className="text-xs text-red-400 mt-2 font-mono">
                {data.last_error_code}: {data.last_error}
              </p>
            )}
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={retry}
                disabled={retrying}
                className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {retrying ? 'Retrying...' : 'Retry setup →'}
              </button>
              <div className="text-xs text-gray-500">
                {t("dashboard.sandbox.attempt")} {data.attempts}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
