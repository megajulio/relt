'use client';

import Link from 'next/link';
import { countChars, hasTemplateMarkers, MAX_BUSINESS_INSTRUCTIONS } from '@/lib/count-chars';
import { useT } from '@/i18n/provider';

/**
 * ORDEN-65 · N5 (ANEXO-65-B) — «Ajuste de este agente».
 *
 * El texto propio de un agente se SUMA a las Instrucciones del negocio; si se
 * contradicen, vale el ajuste. Sigue guardándose en `config.systemPrompt`, con
 * el límite de 4000 code points (`countChars`) y el aviso de corchetes de D4
 * (hay agentes que ya guardaron la plantilla vieja).
 *
 * En el alta empieza VACÍO: la plantilla vive ahora en la página de las
 * Instrucciones del negocio (`business.org-template`).
 */
const defaultCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500';

export default function AgentAdjustment({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useT();
  const chars = countChars(value);
  const over = chars > MAX_BUSINESS_INSTRUCTIONS;
  const showMarkers = hasTemplateMarkers(value);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor="agent-adjustment" className="text-sm text-gray-400">
          {t('business.agent-adjustment')}
        </label>
        <span className={over ? 'text-xs text-red-400' : 'text-xs text-gray-500'}>
          {chars}/{MAX_BUSINESS_INSTRUCTIONS}
        </span>
      </div>
      <textarea
        id="agent-adjustment"
        rows={6}
        className={className ?? defaultCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <p className="text-xs text-gray-500 mt-1">{t('business.agent-adjustment-help')}</p>
      <Link
        href="/dashboard/business-instructions"
        className="inline-block text-xs text-blue-400 hover:text-blue-300 mt-1"
      >
        {t('business.agent-adjustment-link')}
      </Link>
      {showMarkers && (
        <div className="text-xs text-amber-400 mt-1">
          {t('business.completa-los-datos-entre-corchetes')}
        </div>
      )}
    </div>
  );
}
