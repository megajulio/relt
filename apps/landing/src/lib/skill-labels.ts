/**
 * Orden #57 · Bloque 3 (ANEXO-57-G) · D5 / G-4.1 — mapa único tool -> frase.
 *
 * El texto de cada opción de skill se DERIVA de sus tools con este mapa; no se escribe a
 * mano por skill. Cualquier otra tool cae en `Otra capacidad (...)`; nunca queda vacío.
 */

const TOOL_PHRASES: Record<string, string> = {
  'products.search': 'Consulta productos',
  'quotes.create': 'Crea cotizaciones',
  'customers.lookup': 'Busca datos de clientes',
};

/** Frase en lenguaje claro de una tool. Nunca vacía. */
export function toolPhrase(tool: string): string {
  return TOOL_PHRASES[tool] ?? `Otra capacidad (${tool})`;
}

/** Frases de una lista de tools, en orden. */
export function capabilityPhrases(tools: string[]): string[] {
  return tools.map(toolPhrase);
}

/** Una sola línea con las capacidades de una skill. */
export function capabilitiesLabel(tools: string[]): string {
  return tools.map(toolPhrase).join(' · ');
}
