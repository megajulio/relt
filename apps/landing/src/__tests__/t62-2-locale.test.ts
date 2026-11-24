/**
 * Orden #62 v2 · Paso 2 — T62-2 (ANEXO-62-A · D2).
 *
 * Detección del idioma: `es-AR` da `es`; `en-US` y `fr` dan `en`; la cookie gana
 * sobre el navegador; y `<html lang>` coincide con el idioma activo.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveLocale } from '@/i18n/resolve-locale';
import { LOCALE_COOKIE } from '@/i18n/types';

const cookieGet = vi.fn();
const headerGet = vi.fn();

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: cookieGet }),
  headers: async () => ({ get: headerGet }),
}));

vi.mock('next/font/google', () => ({
  Inter: () => ({ className: 'font-inter' }),
}));

describe('T62-2 · detección del idioma', () => {
  it('es-AR da es; en-US y fr dan en', () => {
    expect(resolveLocale(undefined, 'es-AR')).toBe('es');
    expect(resolveLocale(undefined, 'en-US')).toBe('en');
    expect(resolveLocale(undefined, 'fr')).toBe('en');
  });

  it('mira la prioridad de Accept-Language y la subetiqueta', () => {
    expect(resolveLocale(undefined, 'es-AR,es;q=0.9,en;q=0.8')).toBe('es');
    expect(resolveLocale(undefined, 'en-US,en;q=0.9,es;q=0.8')).toBe('en');
    expect(resolveLocale(undefined, 'est')).toBe('en');
    expect(resolveLocale(undefined, '')).toBe('en');
    expect(resolveLocale(undefined, null)).toBe('en');
  });

  it('la cookie válida gana sobre el navegador', () => {
    expect(resolveLocale('es', 'en-US')).toBe('es');
    expect(resolveLocale('en', 'es-AR')).toBe('en');
    // Cookie no válida: decide el navegador.
    expect(resolveLocale('fr', 'es-AR')).toBe('es');
    expect(resolveLocale('', 'en-US')).toBe('en');
  });

  describe('<html lang>', () => {
    beforeEach(() => {
      cookieGet.mockReset();
      headerGet.mockReset();
    });

    it('es el idioma de la cookie', async () => {
      cookieGet.mockReturnValue({ value: 'es' });
      headerGet.mockReturnValue('en-US');
      const { default: RootLayout } = await import('@/app/layout');
      const element = await RootLayout({ children: null });
      expect((element.props as { lang: string }).lang).toBe('es');
      expect(cookieGet).toHaveBeenCalledWith(LOCALE_COOKIE);
    });

    it('sigue al Accept-Language cuando no hay cookie', async () => {
      cookieGet.mockReturnValue(undefined);
      headerGet.mockReturnValue('es-AR');
      const { default: RootLayout } = await import('@/app/layout');
      const element = await RootLayout({ children: null });
      expect((element.props as { lang: string }).lang).toBe('es');
    });

    it('cae a en sin cookie y sin preferencia por es', async () => {
      cookieGet.mockReturnValue(undefined);
      headerGet.mockReturnValue('fr-FR');
      const { default: RootLayout } = await import('@/app/layout');
      const element = await RootLayout({ children: null });
      expect((element.props as { lang: string }).lang).toBe('en');
    });
  });
});
