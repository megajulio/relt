/**
 * Orden #62 v2 · Paso 2 (ANEXO-62-A · D5) — helper de render para los tests.
 *
 * Renderiza `ui` dentro del `I18nProvider` con un idioma fijo, sin depender del
 * navegador ni de la cookie. Lo usan los tests que afirman texto visible.
 */
import type { ReactElement } from 'react';
import { render as rtlRender, type RenderOptions, type RenderResult } from '@testing-library/react';
import { getMessages } from '@/i18n/catalog';
import { I18nProvider } from '@/i18n/provider';
import type { Locale } from '@/i18n/types';

export function renderWithI18n(
  ui: ReactElement,
  locale: Locale = 'en',
  options?: RenderOptions,
): RenderResult {
  // El idioma va en el `wrapper` (y no envolviendo `ui`) para que `rerender()`
  // siga teniendo el proveedor.
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <I18nProvider locale={locale} messages={getMessages(locale)}>
        {children}
      </I18nProvider>
    );
  }

  return rtlRender(ui, { ...options, wrapper: Wrapper });
}
