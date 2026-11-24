/**
 * Orden #62 v2 · Paso 2 (ANEXO-62-A · D2) — selector de idioma.
 *
 * Va en la landing y en el panel. Guarda la cookie `relt_locale` (path=/, un año,
 * SameSite=Lax) y después hace `router.refresh()` para que el servidor vuelva a
 * resolver el idioma de toda la pantalla.
 */
'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useT } from '@/i18n/provider';
import { writeLocaleCookie } from '@/lib/locale-cookie';
import { LOCALES, type Locale } from '@/i18n/types';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();

  function choose(next: Locale) {
    if (next === locale) return;
    writeLocaleCookie(next);
    router.refresh();
  }

  return (
    <div className={className} role="group" aria-label={t('language.selector')}>
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            data-locale={code}
            aria-pressed={active}
            onClick={() => choose(code)}
            className={
              'rounded-md px-2 py-1 text-xs font-medium transition-colors ' +
              (active ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white')
            }
          >
            {t(`language.${code}`)}
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSwitcher;
