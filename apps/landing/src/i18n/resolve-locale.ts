/**
 * Orden #62 v2 · Paso 2 (ANEXO-62-A · D2) — detección del idioma.
 *
 * Regla: gana la cookie válida; si no, `es*` en el `Accept-Language`; si no, `en`.
 */
import { DEFAULT_LOCALE, type Locale } from './types';

/** ¿El valor es uno de los idiomas soportados? */
export function isLocale(value: unknown): value is Locale {
  return value === 'es' || value === 'en';
}

/**
 * Etiqueta de mayor prioridad de un `Accept-Language` (RFC 9110), en minúsculas.
 * Se descartan las entradas con `q=0` (excluidas por el cliente).
 */
export function preferredLanguageTag(acceptLanguage: string | null | undefined): string | null {
  if (!acceptLanguage) return null;

  const entries = acceptLanguage
    .split(',')
    .map((part) => {
      const [rawTag, ...rawParams] = part.trim().split(';');
      const q = rawParams
        .map((p) => p.trim())
        .find((p) => p.toLowerCase().startsWith('q='));
      const parsed = q ? Number.parseFloat(q.slice(2)) : 1;
      const quality = Number.isFinite(parsed) ? parsed : 0;
      return { tag: rawTag.trim().toLowerCase(), quality };
    })
    .filter((entry) => entry.tag.length > 0 && entry.quality > 0);

  if (entries.length === 0) return null;

  entries.sort((a, b) => b.quality - a.quality);
  return entries[0].tag;
}

/**
 * Idioma activo de la petición.
 * @param cookie valor de la cookie `relt_locale` (si no es válido se ignora)
 * @param acceptLanguage cabecera `Accept-Language` de la petición
 */
export function resolveLocale(
  cookie: string | null | undefined,
  acceptLanguage: string | null | undefined,
): Locale {
  if (isLocale(cookie)) return cookie;

  const tag = preferredLanguageTag(acceptLanguage);
  // Solo la subetiqueta de idioma cuenta: `es`, `es-AR` -> `es`; `est` o `en-US` -> `en`.
  if (tag && tag !== '*' && tag.split('-')[0] === 'es') return 'es';

  return DEFAULT_LOCALE;
}
