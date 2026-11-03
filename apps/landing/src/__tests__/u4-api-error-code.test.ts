import { describe, it, expect, vi, afterEach } from 'vitest';
import { api } from '@/lib/api';

/**
 * U4 · `api.ts` debe adjuntar `code` al error cuando el backend lo envía.
 */
describe('U4 · api captura code', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adjunta code al error cuando el 400 lo incluye', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'model is not approved', code: 'model_not_approved' }),
      }),
    );

    await expect(api.post('/x', {})).rejects.toMatchObject({
      code: 'model_not_approved',
      status: 400,
      message: 'model is not approved',
    });
  });

  it('no adjunta code si el body no lo trae', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'boom' }),
      }),
    );

    let caught: unknown;
    try {
      await api.post('/x', {});
    } catch (e) {
      caught = e;
    }
    expect((caught as { code?: string }).code).toBeUndefined();
  });
});
