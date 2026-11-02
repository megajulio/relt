import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Vitest para el paquete landing (Next.js 16 / React 19).
 *
 * - Entorno jsdom (componentes React).
 * - Alias `@/*` → `./src/*` (mismo mapeo que tsconfig.json).
 * - `NEXT_PUBLIC_API_URL` se inlinea: `src/lib/api.ts` lanza al importar si falta.
 */
const TEST_API_URL = 'http://localhost:3001';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/__tests__/setup.ts'],
    env: { NEXT_PUBLIC_API_URL: TEST_API_URL },
  },
  define: {
    'process.env.NEXT_PUBLIC_API_URL': JSON.stringify(TEST_API_URL),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
