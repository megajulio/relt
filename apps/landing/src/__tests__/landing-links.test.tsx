import { describe, it, expect, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import LandingV2 from '@/components/landing/LandingV2';

/**
 * Orden #38 · enlaces internos de la home.
 *
 * Recorre todos los `href` internos (rutas absolutas y anclas) de la home y
 * falla si alguno apunta a una ruta que no existe en `src/app` o a un ancla
 * sin elemento con ese `id`. Antes de la corrección da RED con `/sandbox`
 * (ruta inexistente) y `#connect` (ancla sin `id`); después queda GREEN.
 */

// vitest corre con cwd = apps/landing (donde está vitest.config.mts).
const APP_DIR = join(process.cwd(), 'src', 'app');
const PAGE_FILES = ['page.tsx', 'page.ts', 'page.jsx', 'page.js'];

/** Rutas públicas que resuelve el App Router: cada carpeta con un `page.*`. */
function collectRoutes(dir: string, prefix = ''): string[] {
  const routes: string[] = [];

  if (PAGE_FILES.some((file) => existsSync(join(dir, file)))) {
    routes.push(prefix === '' ? '/' : prefix);
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      routes.push(
        ...collectRoutes(join(dir, entry.name), `${prefix}/${entry.name}`),
      );
    }
  }

  return routes;
}

/** `href` internos: rutas absolutas (`/...`) y anclas (`#...`). */
function internalHrefs(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('a[href]'))
    .map((anchor) => anchor.getAttribute('href') ?? '')
    .filter((href) => href.startsWith('/') || href.startsWith('#'));
}

describe('Landing · enlaces internos', () => {
  beforeAll(() => {
    // jsdom no implementa matchMedia; AgentDemo lo usa al montar.
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  it('todo href interno apunta a una ruta existente o a un ancla con su id', () => {
    const { container } = render(<LandingV2 />);
    const routes = new Set(collectRoutes(APP_DIR));
    const broken: string[] = [];

    for (const href of internalHrefs(container)) {
      if (href.startsWith('#')) {
        const id = href.slice(1);
        if (!container.querySelector(`#${id}`)) {
          broken.push(`ancla sin id: ${href}`);
        }
        continue;
      }

      const path = href.split('#')[0].split('?')[0];
      if (!routes.has(path)) {
        broken.push(`ruta inexistente: ${href}`);
      }
    }

    expect(broken, `enlaces internos rotos: ${broken.join(' | ')}`).toEqual([]);
  });
});
