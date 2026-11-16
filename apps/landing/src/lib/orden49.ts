/**
 * Orden #49 · Bloque 3 · C3 — textos exactos de D2 y D5.
 *
 * D2 (orden v2, línea 30): la pantalla del sandbox de la organización nueva muestra
 * un estado claro con este texto, «en el idioma del resto del dashboard». El dashboard
 * del cliente está en inglés, así que el literal visible es la traducción literal de
 * `D2_CONFLICT_TEXT_ORDER_LITERAL`. El backend persiste el literal en español
 * (`OWNERSHIP_048_D2_MESSAGE`) junto al código `channel_number_conflict`.
 *
 * D5 (orden v2, línea 50): el texto va EXACTO y sin traducción: la orden no lleva la
 * salvedad de idioma que sí tiene D2.
 */

/** D2 · literal de la orden (el que persiste el backend en `last_error`). */
export const D2_CONFLICT_TEXT_ORDER_LITERAL =
  'Este número ya está conectado a otra cuenta de RELT. Desconéctalo de esa cuenta o escríbenos.';

/** D2 · texto visible en el dashboard (inglés, como el resto del dashboard del cliente). */
export const D2_CONFLICT_TEXT =
  'This number is already connected to another RELT account. Disconnect it from that account or write to us.';

/** Código con el que el backend marca el sandbox de la organización rechazada (D2). */
export const D2_CONFLICT_CODE = 'channel_number_conflict';

/** D5 · texto exacto de la orden. No se traduce ni se parafrasea. */
export const D5_NO_AGENT_TEXT =
  'Este número no tiene un agente asignado: responde el flujo genérico.';

/** ¿Este estado del sandbox es el rechazo de D2? */
export function isD2Conflict(
  status: { status?: string | null; last_error_code?: string | null } | null | undefined,
): boolean {
  return status?.status === 'failed' && status.last_error_code === D2_CONFLICT_CODE;
}
