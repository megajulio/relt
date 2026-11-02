import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Limpieza explícita del DOM entre tests (RTL no registra auto-cleanup sin `globals`).
afterEach(() => {
  cleanup();
});
