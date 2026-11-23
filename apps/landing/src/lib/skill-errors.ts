/**
 * Orden #57 · Bloque 3 (ANEXO-57-G) · G-4.2 — textos de error en un solo módulo.
 *
 * El código y el texto del backend NUNCA se muestran crudos: se traducen a lenguaje claro.
 * El backend responde RFC 7807 con `code`, `field` y `meta` (ver `b3-g3-contrato.txt`).
 */

export interface SkillErrorInfo {
  code?: string;
  status?: number;
  field?: string;
  agents?: number;
}

const CODE_TEXTS: Record<string, string> = {
  skill_name_reserved: 'Ese nombre es de una skill de RELT. Elige otro.',
  skill_name_taken: 'Ya tienes una skill con ese nombre.',
  skill_base_not_found: 'La skill base no existe.',
  tool_not_in_base: 'Elegiste una capacidad que la skill base no tiene.',
  instructions_too_long: 'Las instrucciones superan el límite de caracteres.',
  skill_limit_reached: 'Llegaste al máximo de 20 skills activas.',
  skill_read_only: 'Las skills de RELT no se pueden editar.',
  skill_not_found: 'Esa skill no existe o no está disponible.',
};

const FALLBACK = 'No se pudo guardar. Intenta de nuevo.';
const ROLE_403 = 'Tu rol no permite crear ni editar skills. Pídeselo a un administrador.';

/** Texto en lenguaje claro para un error de skills (G-4.2). */
export function skillErrorMessage(info: SkillErrorInfo): string {
  if (info.code === 'field_too_long') {
    return `El campo ${info.field ?? 'indicado'} es demasiado largo.`;
  }
  if (info.code === 'skill_in_use') {
    return `La usan ${info.agents ?? 0} agentes.`;
  }
  if (info.code && CODE_TEXTS[info.code]) {
    return CODE_TEXTS[info.code];
  }
  if (info.status === 403) {
    return ROLE_403;
  }
  return FALLBACK;
}

interface ErrorLike {
  code?: string;
  status?: number;
  field?: string;
  meta?: { agents?: number };
}

/** Extrae los campos del error de `api.ts` y devuelve su texto claro. */
export function skillErrorFrom(err: unknown): string {
  const e = (err ?? {}) as ErrorLike;
  return skillErrorMessage({ code: e.code, status: e.status, field: e.field, agents: e.meta?.agents });
}
