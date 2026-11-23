import { api } from './api';

/**
 * Orden #57 · Bloque 3 — API de skills del control plane (contrato leído con
 * `git show 38fd9c8` en `b3-g3-contrato.txt`).
 *
 * `GET /control/v1/skills` devuelve repo + org, con `kind`. El DETALLE
 * (`GET /control/v1/skills/:name`) es el que expone las tools: `versions[].tools`
 * (repo) y `allowed_tools` (org). Ese es el dato para los checkboxes y para las
 * capacidades del selector (D5): el panel NO inventa la lista.
 */

export type SkillKind = 'repo' | 'org';

export interface SkillListItem {
  name: string;
  latest_version: string;
  description: string;
  tools_count: number;
  permissions: string[];
  triggers: string[];
  kind: SkillKind;
  /** Solo en skills de org (`orgListItem`). */
  display_name?: string;
  allowed_tools?: string[];
  base_skill?: string;
  /** Instrucciones (solo si el listado las trae; el detalle de la API sí). */
  instructions?: string;
  status?: 'active' | 'archived';
}

/** Skill de la lista + sus tools (derivadas del detalle o de `allowed_tools`). */
export interface SkillWithTools extends SkillListItem {
  tools: string[];
}

export interface SkillVersion {
  version: string;
  description: string;
  permissions: string[];
  tools: string[];
  triggers: string[];
  instructions: string;
}

export interface SkillDetail {
  name: string;
  kind: SkillKind;
  latest_version: string;
  versions: SkillVersion[];
  display_name?: string;
  allowed_tools?: string[];
  base_skill?: string;
  status?: 'active' | 'archived';
  instructions?: string;
}

interface SkillListResponse {
  skills: SkillListItem[];
  total: number;
}

/**
 * Listado de skills con las tools de cada una (lo usan el selector de D5 y los checkboxes):
 * `allowed_tools` para las de org; el detalle (`versions[0].tools`) para las de RELT. El panel
 * NO inventa la lista: la deriva de la API (G-3). Si el listado no trae `kind`/tools, el
 * llamador muestra solo el nombre.
 */
export async function listSkills(): Promise<SkillWithTools[]> {
  const response = await api.get<SkillListResponse>('/control/v1/skills');
  return Promise.all(
    response.skills.map(async (item) => {
      if (item.kind === 'org' && item.allowed_tools) {
        return { ...item, tools: item.allowed_tools };
      }
      const detail = await getSkill(item.name);
      return { ...item, tools: toolsOf(detail) };
    })
  );
}

/** Alias explícito del listado enriquecido (lo usa la página de skills). */
export const listSkillsWithTools = listSkills;

export async function getSkill(name: string): Promise<SkillDetail> {
  return api.get<SkillDetail>(`/control/v1/skills/${encodeURIComponent(name)}`);
}

/** Tools de una skill: `allowed_tools` (org) o `versions[0].tools` (repo). */
export function toolsOf(detail: SkillDetail): string[] {
  return detail.allowed_tools ?? detail.versions[0]?.tools ?? [];
}

export interface CreateOrgSkillInput {
  name: string;
  display_name?: string;
  description?: string;
  base_skill: string;
  instructions?: string;
  allowed_tools?: string[];
}

export async function createOrgSkill(input: CreateOrgSkillInput): Promise<SkillDetail> {
  return api.post<SkillDetail>('/control/v1/skills', input);
}

export interface PatchOrgSkillInput {
  display_name?: string;
  description?: string;
  instructions?: string;
  allowed_tools?: string[];
  status?: 'active' | 'archived';
}

export async function patchOrgSkill(name: string, patch: PatchOrgSkillInput): Promise<SkillDetail> {
  return api.patch<SkillDetail>(`/control/v1/skills/${encodeURIComponent(name)}`, patch);
}
