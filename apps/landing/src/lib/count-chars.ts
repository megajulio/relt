/**
 * Orden #57 · Bloque 3 (ANEXO-57-G) · D4/A-5 — unidad de conteo de texto.
 *
 * Un solo helper `countChars` = code points Unicode (`Array.from`) sobre el texto ya
 * normalizado. Se usa en TODOS los límites de texto del panel (Instrucciones del negocio
 * y de una skill). `String.length` (unidades UTF-16) NO se usa para estos límites.
 *
 * Normalización (valores fijados de la orden):
 *   1) `\r\n` y `\r` -> `\n`;
 *   2) después, `trim`;
 *   3) sin normalización NFC/NFD: se guarda lo que se envió.
 */

/** Instrucciones del negocio (D4): máximo 4000 code points. */
export const MAX_BUSINESS_INSTRUCTIONS = 4000;

/**
 * Instrucciones del negocio por organización (ORDEN-65 · A-2): máximo 8000.
 * Es un límite PROPIO de la página nueva; `MAX_BUSINESS_INSTRUCTIONS` (4000)
 * sigue siendo el del ajuste de cada agente.
 */
export const MAX_ORG_INSTRUCTIONS = 8000;


/** Instrucciones de una skill de org (D2): máximo 8000 code points. */
export const MAX_SKILL_INSTRUCTIONS = 8000;

/** `\r\n` y `\r` -> `\n`, después `trim`, sin NFC/NFD. */
export function normalizeText(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

/** Cuenta code points Unicode del texto normalizado. */
export function countChars(value: string): number {
  return Array.from(normalizeText(value)).length;
}

/** Marcadores de plantilla sin completar, por ejemplo `[qué vendes]`. */
export function hasTemplateMarkers(value: string): boolean {
  return /\[[^\]]+\]/.test(value);
}

/** Caracteres de control Unicode `Cc`, salvo `\n` y `\t`. */
export function hasForbiddenControlChar(value: string): boolean {
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value);
}
