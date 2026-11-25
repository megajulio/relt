/**
 * Orden #62 · ANEXO-62-A (D2) — textos de error en lenguaje claro (G-4.2).
 *
 * Orden #57 · Bloque 3 (ANEXO-57-G) · G-4.2: el código y el texto del backend NUNCA
 * se muestran crudos. Desde la #62 el texto vive en el catálogo (`errors.<código>`),
 * en los dos idiomas; aquí solo se mapea el código a su clave.
 */
import type { TFunction } from '@/i18n/types';

export interface SkillErrorInfo {
  code?: string;
  status?: number;
  field?: string;
  agents?: number;
}

const CODE_KEYS: Record<string, string> = {
  skill_name_reserved: 'errors.skill_name_reserved',
  skill_name_taken: 'errors.skill_name_taken',
  skill_base_not_found: 'errors.skill_base_not_found',
  tool_not_in_base: 'errors.tool_not_in_base',
  instructions_too_long: 'errors.instructions_too_long',
  skill_limit_reached: 'errors.skill_limit_reached',
  skill_read_only: 'errors.skill_read_only',
  skill_not_found: 'errors.skill_not_found',
  // Orden #64 · ANEXO-64-E (E-2): códigos nuevos del Bloque 1.
  skill_not_published: 'errors.skill_not_published',
  skill_archived: 'errors.skill_archived',
  nothing_to_publish: 'errors.nothing_to_publish',
  publish_conflict: 'errors.publish_conflict',
  invalid_status: 'errors.invalid_status',
  skill_invalid_name: 'errors.skill_invalid_name',
  invalid_control_chars: 'errors.invalid_control_chars',
  skill_version_not_found: 'errors.skill_version_not_found',
  // ANEXO-64-F (F-2.11, M10): todo código del contrato que llega al panel tiene su texto.
  invalid_field: 'errors.invalid_field',
  field_read_only: 'errors.field_read_only',
};


/** Texto en lenguaje claro para un error de skills (G-4.2), en el idioma activo. */
export function skillErrorMessage(t: TFunction, info: SkillErrorInfo): string {
  if (info.code === 'field_too_long') {
    return t('errors.field_too_long', { field: info.field ?? t('errors.field_default') });
  }
  // ANEXO-64-F (F-2.11, M10): `field_read_only` también lleva el campo en su texto.
  if (info.code === 'field_read_only') {
    return t('errors.field_read_only', { field: info.field ?? t('errors.field_default') });
  }
  if (info.code === 'skill_in_use') {
    return t('errors.skill_in_use', { count: info.agents ?? 0 });
  }

  const key = info.code ? CODE_KEYS[info.code] : undefined;
  if (key) return t(key);

  if (info.status === 403) {
    return t('errors.role_403');
  }
  return t('errors.fallback');
}

interface ErrorLike {
  code?: string;
  status?: number;
  field?: string;
  meta?: { agents?: number };
}

/** Extrae los campos del error de `api.ts` y devuelve su texto claro. */
export function skillErrorFrom(t: TFunction, err: unknown): string {
  const e = (err ?? {}) as ErrorLike;
  return skillErrorMessage(t, { code: e.code, status: e.status, field: e.field, agents: e.meta?.agents });
}
