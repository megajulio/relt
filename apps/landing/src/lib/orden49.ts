/**
 * Orden #49 · Bloque 3 · C3 — textos exactos de D2 y D5.
 *
 * D2 (orden v2, línea 30): la pantalla del sandbox de la organización nueva muestra
 * un estado claro con este texto, «en el idioma del resto del dashboard». El dashboard
 * del cliente está en inglés, así que el literal visible es la traducción literal de
 * `D2_CONFLICT_TEXT_ORDER_LITERAL`. El backend persiste el literal en español
 * (`OWNERSHIP_048_D2_MESSAGE`) junto al código `channel_number_conflict`.
 *
 * D5 (orden v2, línea 50): el aviso va en el sandbox, en Channels y en el detalle del Agent,
 * con el mismo criterio de idioma que D2 (corrección H3-2): el texto VISIBLE es el inglés
 * exacto; el literal español de la orden se conserva en `D5_NO_AGENT_TEXT_ORDER_LITERAL`.
 */

/** D2 · literal de la orden (el que persiste el backend en `last_error`). */
export const D2_CONFLICT_TEXT_ORDER_LITERAL =
  'Este número ya está conectado a otra cuenta de RELT. Desconéctalo de esa cuenta o escríbenos.';

/** D2 · texto visible en el dashboard (inglés, como el resto del dashboard del cliente). */
export const D2_CONFLICT_TEXT =
  'This number is already connected to another RELT account. Disconnect it from that account or write to us.';

/** Código con el que el backend marca el sandbox de la organización rechazada (D2). */
export const D2_CONFLICT_CODE = 'channel_number_conflict';

/**
 * D5 · literal de la orden (se conserva como referencia y para los tests del literal).
 * El texto VISIBLE va en el idioma del dashboard, igual que D2 (corrección H3-2).
 *
 * Orden #51 · C3 (G3, D-50.4): el aviso pasa a ser fiel al enrutamiento. El Agent se
 * resuelve por `conversations.agent_id`, así que lo que cambia al asignar es lo que
 * reciben las conversaciones NUEVAS; las existentes conservan su Agent.
 */
export const D5_NO_AGENT_TEXT_ORDER_LITERAL =
  'Este número no tiene un agente asignado: las conversaciones nuevas reciben la respuesta genérica.';

/** D5 · texto visible en el dashboard (inglés), exacto. */
export const D5_NO_AGENT_TEXT =
  'This number has no agent assigned: new conversations get the generic reply.';

/** ¿Este estado del sandbox es el rechazo de D2? */
export function isD2Conflict(
  status: { status?: string | null; last_error_code?: string | null } | null | undefined,
): boolean {
  return status?.status === 'failed' && status.last_error_code === D2_CONFLICT_CODE;
}
