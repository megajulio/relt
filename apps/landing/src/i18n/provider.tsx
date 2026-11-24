/**
 * Orden #62 v2 · Paso 2 (ANEXO-62-A · D2) — proveedor cliente.
 *
 * El layout raíz (servidor) resuelve el idioma, fija `<html lang>` y le pasa el
 * idioma y su catálogo. Los componentes cliente usan `useT()`.
 */
'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { translateWith } from './translate';
import type { Locale, Messages, Params, TFunction } from './types';

interface I18nValue {
  locale: Locale;
  t: TFunction;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      t: (key: string, params?: Params) => translateWith(messages, locale, key, params),
    }),
    [locale, messages],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Acceso completo (idioma + traductor). */
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('[i18n] useI18n() se usó fuera de <I18nProvider>');
  }
  return ctx;
}

/** Traductor del idioma activo. */
export function useT(): TFunction {
  return useI18n().t;
}

/** Idioma activo. */
export function useLocale(): Locale {
  return useI18n().locale;
}
