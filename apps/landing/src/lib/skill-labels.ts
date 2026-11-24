/**
 * Orden #57 · Bloque 3 (ANEXO-57-G) · D5 / G-4.1 — mapa único tool -> frase.
 *
 * El texto de cada opción de skill se DERIVA de sus tools con este mapa; no se escribe a
 * mano por skill. Cualquier otra tool cae en `Otra capacidad (...)`; nunca queda vacío.
 */

import type { TFunction } from '@/i18n/types';

const TOOL_KEYS: Record<string, string> = {
  'products.search': 'skills.tool.products.search',
  'quotes.create': 'skills.tool.quotes.create',
  'customers.lookup': 'skills.tool.customers.lookup',
};

/** Frase en lenguaje claro de una tool, en el idioma activo. Nunca vacía. */
export function toolPhrase(t: TFunction, tool: string): string {
  const key = TOOL_KEYS[tool];
  return key ? t(key) : t('skills.tool.fallback', { tool });
}

/** Frases de una lista de tools, en orden. */
export function capabilityPhrases(t: TFunction, tools: string[]): string[] {
  return tools.map((tool) => toolPhrase(t, tool));
}

/** Una sola línea con las capacidades de una skill. */
export function capabilitiesLabel(t: TFunction, tools: string[]): string {
  return tools.map((tool) => toolPhrase(t, tool)).join(' · ');
}
