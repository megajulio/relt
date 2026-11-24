import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setStrictTranslations } from '@/i18n/translate';

// Orden #62 · ANEXO-62-A (D6): en los tests, una clave de catálogo inexistente falla.
setStrictTranslations(true);

// Limpieza explícita del DOM entre tests (RTL no registra auto-cleanup sin `globals`).
afterEach(() => {
  cleanup();
});
