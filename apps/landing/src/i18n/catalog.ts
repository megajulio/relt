/**
 * Orden #62 v2 · Paso 2 (ANEXO-62-A · D2) — catálogos e interfaz de servidor.
 *
 * Este módulo sí importa los dos JSON. Lo usan el layout (servidor), los tests y
 * el guardián; los componentes cliente usan `useT()` de `./provider`.
 */
import en from './messages/en.json';
import es from './messages/es.json';
import { translateWith } from './translate';
import type { Locale, Messages, Params } from './types';

const CATALOGS: Record<Locale, Messages> = {
  en: en as Messages,
  es: es as Messages,
};

/** Catálogo completo de un idioma (se le pasa al `I18nProvider`). */
export function getMessages(locale: Locale): Messages {
  return CATALOGS[locale];
}

/** Traduce `key` al idioma dado. Firma del ANEXO-62-A (D2). */
export function translate(locale: Locale, key: string, params?: Params): string {
  return translateWith(CATALOGS[locale], locale, key, params);
}

/** Claves de un catálogo (para los tests y el guardián). */
export function catalogKeys(locale: Locale): string[] {
  return Object.keys(CATALOGS[locale]);
}
