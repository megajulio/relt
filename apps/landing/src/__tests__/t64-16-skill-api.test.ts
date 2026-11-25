import { describe, expect, it, vi } from 'vitest';

/**
 * T64-16 (Orden #64 · ANEXO-64-F · F-3) — la capa de datos de skills, con `./api` simulado.
 * Comprueba la ruta, el método y el cuerpo EXACTOS de `getPublishPreview`, `publishOrgSkill`
 * y `listSkillVersions` (contrato del Bloque 1, `64/b2-contrato.txt` §7, §6 y §8).
 */

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  request: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ api }));

import { getPublishPreview, listSkillVersions, publishOrgSkill } from '@/lib/skills';
import { publishPreview, versionRecord } from './t64-fixtures';

describe('T64-16 · capa de datos de skills (./api simulado)', () => {
  it('getPublishPreview: GET a la ruta exacta', async () => {
    api.get.mockResolvedValue(publishPreview());
    const res = await getPublishPreview('tienda');
    expect(api.get).toHaveBeenCalledWith('/control/v1/skills/tienda/publish-preview');
    expect(res.next_version).toBe('1.3.0');
  });

  it('publishOrgSkill: POST a la ruta exacta con el cuerpo exacto', async () => {
    api.post.mockResolvedValue({});
    await publishOrgSkill('tienda', { changelog: 'notas', expected_version: '1.3.0' });
    expect(api.post).toHaveBeenCalledWith('/control/v1/skills/tienda/publish', {
      changelog: 'notas',
      expected_version: '1.3.0',
    });
  });

  it('publishOrgSkill: sin changelog, el cuerpo solo lleva expected_version', async () => {
    api.post.mockResolvedValue({});
    await publishOrgSkill('tienda', { expected_version: '2.0.0' });
    expect(api.post).toHaveBeenCalledWith('/control/v1/skills/tienda/publish', {
      expected_version: '2.0.0',
    });
  });

  it('listSkillVersions: GET a la ruta exacta', async () => {
    api.get.mockResolvedValue({ versions: [versionRecord()], total: 1 });
    const res = await listSkillVersions('tienda');
    expect(api.get).toHaveBeenCalledWith('/control/v1/skills/tienda/versions');
    expect(res.total).toBe(1);
  });

  it('los nombres con caracteres raros van URL-encoded', async () => {
    api.get.mockResolvedValue({ versions: [], total: 0 });
    await listSkillVersions('mi tienda/x');
    expect(api.get).toHaveBeenCalledWith('/control/v1/skills/mi%20tienda%2Fx/versions');
  });
});
