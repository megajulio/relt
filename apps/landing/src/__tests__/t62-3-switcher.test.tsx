/**
 * Orden #62 v2 · Paso 2 — T62-3 (ANEXO-62-A · D2).
 *
 * El selector cambia el idioma de la pantalla entera (deja la cookie `relt_locale`
 * y pide un refresco al servidor) y ninguna pantalla mezcla los dos idiomas.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { renderWithI18n } from './render-with-i18n';
import { LanguageSwitcher } from '@/components/language-switcher';
import LoginPage from '@/app/login/page';

const refresh = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh, push, replace: vi.fn() }),
  usePathname: () => '/login',
}));

vi.mock('@/lib/auth', () => ({
  login: vi.fn(),
  Logout: vi.fn(),
}));

function clearLocaleCookie() {
  document.cookie = 'relt_locale=; path=/; max-age=0';
}

describe('T62-3 · selector de idioma', () => {
  afterEach(() => {
    cleanup();
    clearLocaleCookie();
    refresh.mockClear();
  });

  it('guarda la cookie relt_locale y pide el refresco de la pantalla', () => {
    renderWithI18n(
      <>
        <LoginPage />
        <LanguageSwitcher />
      </>,
      'en',
    );

    expect(document.cookie).not.toContain('relt_locale=es');

    fireEvent.click(screen.getByRole('button', { name: 'Español' }));

    expect(document.cookie).toContain('relt_locale=es');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('no vuelve a refrescar si el idioma elegido ya está activo', () => {
    renderWithI18n(<LanguageSwitcher />, 'en');
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(refresh).not.toHaveBeenCalled();
  });

  it('la pantalla entera se muestra en un solo idioma', () => {
    renderWithI18n(<LoginPage />, 'en');
    expect(screen.getByText('Sign in to Relt')).toBeTruthy();
    expect(screen.getByText('create a new account')).toBeTruthy();
    expect(screen.queryByText('Inicia sesión en Relt')).toBeNull();
    cleanup();

    renderWithI18n(<LoginPage />, 'es');
    expect(screen.getByText('Inicia sesión en Relt')).toBeTruthy();
    expect(screen.getByText('crea una cuenta nueva')).toBeTruthy();
    expect(screen.queryByText('Sign in to Relt')).toBeNull();
    expect(screen.queryByText('create a new account')).toBeNull();
  });
});
