/**
 * Orden #62 v2 · Paso 2 (ANEXO-62-A · D2) — cookie del selector de idioma.
 *
 * La escritura vive aquí, fuera del componente: así el guardián de `react-hooks`
 * (regla de inmutabilidad) no la marca como una modificación de un valor externo
 * hecha desde el cuerpo de un componente.
 */
import { LOCALE_COOKIE, type Locale } from '@/i18n/types';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Guarda la elección de idioma en `relt_locale` (path=/, un año, SameSite=Lax). */
export function writeLocaleCookie(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}
