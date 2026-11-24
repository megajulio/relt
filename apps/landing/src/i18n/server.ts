/**
 * Orden #62 v2 · Paso 2 (ANEXO-62-A · D2) — idioma activo en el servidor.
 *
 * Lee la cookie `relt_locale` y el `Accept-Language` de la petición. Usar esto en
 * el layout raíz es lo que vuelve dinámicas las páginas (D7): no hay nada estático
 * que memorice un idioma.
 */
import { cookies, headers } from 'next/headers';
import { resolveLocale } from './resolve-locale';
import { LOCALE_COOKIE, type Locale } from './types';

export async function getActiveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerStore.get('accept-language'));
}
