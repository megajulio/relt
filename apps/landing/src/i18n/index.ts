/**
 * Orden #62 v2 · Paso 2 (ANEXO-62-A · D2) — punto de entrada del i18n.
 */
export { catalogKeys, getMessages, translate } from './catalog';
export { isLocale, preferredLanguageTag, resolveLocale } from './resolve-locale';
export { interpolate, lookup, translateWith } from './translate';
export { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES } from './types';
export type { Locale, Messages, Params, TFunction } from './types';
