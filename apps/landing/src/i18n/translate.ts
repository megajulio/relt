/**
 * Orden #62 v2 · Paso 2 (ANEXO-62-A · D2) — interpolación y plurales.
 *
 * `translateWith` es puro (no importa los catálogos), así que lo puede usar el
 * cliente sin arrastrar los dos JSON al bundle.
 */
import type { Locale, Messages, Params } from './types';

/** Valor crudo de una clave plana, o `undefined`. */
export function lookup(messages: Messages, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(messages, key) ? messages[key] : undefined;
}

/** Sustituye `{nombre}` por su parámetro; lo que no venga, se deja tal cual. */
export function interpolate(template: string, params: Params): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

function pluralKey(locale: Locale, key: string, count: number): string {
  const category = new Intl.PluralRules(locale).select(count);
  return `${key}.${category}`;
}

/**
 * Modo estricto: con él, una clave inexistente LANZA (lo activa `src/__tests__/setup.ts`).
 * Sin él (producción) se muestra la clave, nunca un texto vacío (ANEXO-62-A · D6).
 * Es una bandera explícita y no una variable de entorno: el panel no añade ninguna.
 */
let strictTranslations = false;

export function setStrictTranslations(value: boolean): void {
  strictTranslations = value;
}

function render(value: unknown, key: string, params: Params): string {
  if (typeof value !== 'string' || value.length === 0) {
    if (strictTranslations) {
      throw new Error(`[i18n] clave inexistente o vacía: ${key}`);
    }
    return key;
  }
  return interpolate(value, params);
}

/**
 * Traduce con un catálogo dado. Si la clave no existe y llega `count`, busca la
 * forma plural (`clave.one` / `clave.other`) con `Intl.PluralRules`.
 */
export function translateWith(
  messages: Messages,
  locale: Locale,
  key: string,
  params: Params = {},
): string {
  let value = lookup(messages, key);

  if (typeof params.count === 'number') {
    const marked = pluralKey(locale, key, params.count);
    if (typeof value !== 'string') {
      value = lookup(messages, marked) ?? lookup(messages, `${key}.other`);
    }
  }

  return render(value, key, params);
}
