import { api } from './api';

/**
 * ORDEN-65 · Bloque 2 (ANEXO-65-B) — Instrucciones del negocio (una por organización).
 *
 * Contrato del Bloque 1, copiado de `GET`/`PUT /control/v1/business-instructions`:
 *   GET  -> 200 { content, revision, updated_at, max_length, can_edit }
 *   PUT  { content, expected_revision } -> 200 misma forma
 *          403 `insufficient-role`; 400 `instructions_too_long` |
 *          `invalid_control_chars` | `invalid_expected_revision`;
 *          409 { code: 'instructions_conflict', current_revision }
 *
 * La organización sale de la sesión (cookie); este módulo no la manda.
 */

export interface BusinessInstructions {
  content: string;
  revision: number;
  updated_at: string | null;
  max_length: number;
  can_edit: boolean;
}

/** Lectura de las instrucciones del negocio de la organización de la sesión. */
export async function getBusinessInstructions(): Promise<BusinessInstructions> {
  return api.get<BusinessInstructions>('/control/v1/business-instructions');
}

/**
 * Guardado con revisión optimista. `expected_revision` es obligatorio en la API:
 * la revisión que devolvió la última lectura o guardado.
 */
export async function putBusinessInstructions(
  content: string,
  expectedRevision: number,
): Promise<BusinessInstructions> {
  return api.request<BusinessInstructions>('/control/v1/business-instructions', {
    method: 'PUT',
    body: JSON.stringify({ content, expected_revision: expectedRevision }),
  });
}
