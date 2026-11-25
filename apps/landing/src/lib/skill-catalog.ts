/**
 * Orden #64 · ANEXO-64-E (E-2, V8/A-3) — lógica pura de los selectores de skills.
 *
 * Vive en su propio módulo (y no en `./skills`) porque los tests que mockean el
 * cliente de la API (`@/lib/skills`) no deben arrastrar estas funciones: los
 * selectores las usan de verdad.
 */
import type { SkillKind, SkillStatus } from './skills';

/**
 * V8 — los selectores (alta y pestaña Skills) muestran solo las skills de RELT y las
 * de org `active`. Un `draft` no se puede asignar (V2) y una `archived` tampoco.
 */
export function selectableSkills<T extends { kind?: SkillKind; status?: SkillStatus }>(
  skills: T[],
): T[] {
  // Un `kind` ausente se trata como `repo` (solo las de org tienen `status`); así el
  // filtro no descarta listados antiguos que no traen `kind`.
  return skills.filter((skill) => skill.kind !== 'org' || skill.status === 'active');
}

/**
 * A-3/V8 — las capacidades que muestra un selector son las **publicadas**
 * (`published_tools`) para una skill de org; para una de RELT, las del repositorio.
 * El panel NO muestra la copia de trabajo en los selectores.
 */
export function selectorTools(skill: {
  kind: SkillKind;
  tools?: string[];
  published_tools?: string[] | null;
}): string[] {
  if (skill.kind === 'org') return skill.published_tools ?? [];
  return skill.tools ?? [];
}
