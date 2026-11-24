/**
 * Orden #62 v2 · Paso 2 (ANEXO-62-A · D2) — tipos del i18n propio.
 *
 * Sin dependencias: un proveedor React y dos catálogos JSON con las mismas claves.
 * Las claves son planas y con prefijo de pantalla (`landing.*`, `dashboard.*`, …).
 */

/** Los dos idiomas de la DEC-020. */
export type Locale = 'es' | 'en';

/** Los idiomas soportados, en el orden del selector. */
export const LOCALES: readonly Locale[] = ['es', 'en'];

/** Idioma por defecto cuando no hay cookie válida ni el navegador prefiere `es`. */
export const DEFAULT_LOCALE: Locale = 'en';

/** Cookie donde el selector guarda la elección. */
export const LOCALE_COOKIE = 'relt_locale';

/** Parámetros de interpolación (`{nombre}`) y de plural (`count`). */
export type Params = Record<string, string | number>;

/** Un catálogo: clave plana -> texto (o formas plurales `clave.one` / `clave.other`). */
export type Messages = Record<string, string>;

/** Traductor ligado a un idioma. */
export type TFunction = (key: string, params?: Params) => string;
