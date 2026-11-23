'use client';

import { countChars, hasTemplateMarkers, MAX_BUSINESS_INSTRUCTIONS } from '@/lib/count-chars';

/**
 * Orden #57 · Bloque 3 (ANEXO-57-G) · D4/D7 — «Instrucciones del negocio».
 *
 * Reutiliza `config.systemPrompt`. Muestra el contador `n/4000` con `countChars` y, sin
 * bloquear, un aviso si quedan marcadores de plantilla (`[algo]`).
 */

/** Plantilla de D4 (solo panel; el backend no pone texto por defecto). */
export const BUSINESS_INSTRUCTIONS_TEMPLATE =
  'Somos [nombre del negocio]. Vendemos [qué vendes].\n' +
  'Horario de atención: [días y horas].\n' +
  'Tono: [cercano / formal].\n' +
  'Si te preguntan algo que no sabes (precios, stock, envíos), no lo inventes: di que una persona del equipo responderá pronto.';

const defaultCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500';

export default function BusinessInstructions({
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
  const chars = countChars(value);
  const over = chars > MAX_BUSINESS_INSTRUCTIONS;
  const showMarkers = hasTemplateMarkers(value);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor="business-instructions" className="text-sm text-gray-400">
          Instrucciones del negocio
        </label>
        <span className={over ? 'text-xs text-red-400' : 'text-xs text-gray-500'}>
          {chars}/{MAX_BUSINESS_INSTRUCTIONS}
        </span>
      </div>
      <textarea
        id="business-instructions"
        rows={6}
        className={className ?? defaultCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {showMarkers && (
        <div className="text-xs text-amber-400 mt-1">Completa los datos entre corchetes</div>
      )}
    </div>
  );
}
