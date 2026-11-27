import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';

/**
 * ORDEN-69 · Bloque 2 · T69-9 · ANEXO-69-A A-6, A-11 y D6.
 *
 * El QR vincula un teléfono: es una ACCIÓN de escritura. Con `member` y `viewer`
 * (el rol sale de `/auth/me`, la misma pieza que en los agentes) la página
 * **no pide** `/sandbox/qr`, muestra el aviso `sandbox.qr_read_only_role` y no
 * deja ver el QR ni los botones «Actualizar QR», «Reconectar WhatsApp» ni
 * «Reintentar». Con `owner` y `admin`, como hoy. Si igual llega un **403**, se
 * ve el mismo aviso (no el error genérico) y **no se reintenta solo**.
 * Los textos van en `es` y en `en` (T62-4).
 */
const state = vi.hoisted(() => ({
  role: 'member' as string | null,
  qrCalls: 0,
  qr: null as null | (() => Promise<unknown>),
}));

vi.mock('@/components/dashboard/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({
    data: {
      user: { id: 'u-1', email: 'u@example.invalid', name: 'User' },
      organizations: [{ id: 'org-1', name: 'Org', role: state.role }],
    },
    logout: async () => {},
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/lib/api', () => ({
  api: {
    request: vi.fn(async (path: string) => {
      if (path === '/control/v1/sandbox/qr') {
        state.qrCalls += 1;
        if (state.qr) return state.qr();
        return { status: 'no_qr_available' };
      }
      if (path === '/control/v1/sandbox/connection') {
        return { state: 'qr_required', instance_name: 'inst-1', provider: 'evolution' };
      }
      return {};
    }),
  },
}));

vi.mock('@/lib/use-sandbox-status', () => ({
  useSandboxStatus: () => ({ data: null, loading: false, error: null, retry: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/lib/use-unassigned-channels', () => ({
  useUnassignedChannels: () => ({
    channels: [],
    singleActiveAgent: null,
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

import SandboxPage from '@/app/dashboard/sandbox/page';
import es from '@/i18n/messages/es.json';
import en from '@/i18n/messages/en.json';
import { renderWithI18n } from './render-with-i18n';

const AVISO_ES = 'Tu rol no permite vincular un teléfono. Pídeselo a un administrador.';
const AVISO_EN = "Your role can't link a phone. Ask an admin.";

const qrConCodigo = () => ({ status: 'ready', qr_base64: 'data:image/png;base64,QUJD' });

const botonQR = (nombre: RegExp) => screen.queryByRole('button', { name: nombre });

describe('T69-9 · el QR del sandbox y el rol', () => {
  beforeEach(() => {
    state.role = 'member';
    state.qrCalls = 0;
    state.qr = async () => qrConCodigo();
  });
  afterEach(() => cleanup());

  for (const role of ['member', 'viewer']) {
    it(`con ${role}: 0 llamadas a /sandbox/qr, aviso visible y ningún botón`, async () => {
      state.role = role;
      renderWithI18n(<SandboxPage />, 'es');

      await waitFor(() =>
        expect(screen.queryByTestId('sandbox-qr-read-only-role')).not.toBeNull(),
      );

      expect(screen.queryByText(AVISO_ES)).not.toBeNull();
      expect(state.qrCalls).toBe(0);
      expect(screen.queryByRole('img', { name: /Código QR/i })).toBeNull();
      expect(botonQR(/Actualizar QR/i)).toBeNull();
      expect(botonQR(/Reconectar WhatsApp/i)).toBeNull();
      expect(botonQR(/Reintentar/i)).toBeNull();
      expect(botonQR(/Comprobar de nuevo/i)).toBeNull();
    });
  }

  for (const role of ['owner', 'admin']) {
    it(`con ${role}: pide el QR y lo muestra, como hoy`, async () => {
      state.role = role;
      renderWithI18n(<SandboxPage />, 'es');

      await waitFor(() =>
        expect(screen.queryByRole('img', { name: /Código QR/i })).not.toBeNull(),
      );

      expect(state.qrCalls).toBeGreaterThan(0);
      expect(screen.queryByTestId('sandbox-qr-read-only-role')).toBeNull();
      expect(botonQR(/Actualizar QR/i)).not.toBeNull();
    });
  }

  it('un rol desconocido se comporta como hoy (pide el QR)', async () => {
    state.role = null;
    renderWithI18n(<SandboxPage />, 'es');
    await waitFor(() => expect(state.qrCalls).toBeGreaterThan(0));
    expect(screen.queryByTestId('sandbox-qr-read-only-role')).toBeNull();
  });

  it('un 403 muestra el aviso del rol, no el error genérico, y no reintenta solo', async () => {
    state.role = 'admin';
    state.qr = async () => {
      const err = new Error('Forbidden') as Error & { status?: number };
      err.status = 403;
      throw err;
    };

    renderWithI18n(<SandboxPage />, 'es');

    await waitFor(() =>
      expect(screen.queryByTestId('sandbox-qr-forbidden')).not.toBeNull(),
    );

    expect(screen.queryByText(AVISO_ES)).not.toBeNull();
    expect(screen.queryByText('No se pudo cargar el código QR')).toBeNull();
    expect(botonQR(/Reintentar/i)).toBeNull();

    const trasLaCarga = state.qrCalls;
    await new Promise((resolve) => setTimeout(resolve, 120));
    expect(state.qrCalls).toBe(trasLaCarga);
    expect(trasLaCarga).toBe(1);
  });

  it('los textos del aviso están en es y en (T62-4)', async () => {
    expect((es as Record<string, string>)['sandbox.qr_read_only_role']).toBe(AVISO_ES);
    expect((en as Record<string, string>)['sandbox.qr_read_only_role']).toBe(AVISO_EN);

    state.role = 'member';
    renderWithI18n(<SandboxPage />, 'en');
    await waitFor(() => expect(screen.queryByText(AVISO_EN)).not.toBeNull());
    expect(screen.queryByText(AVISO_ES)).toBeNull();
  });
});
