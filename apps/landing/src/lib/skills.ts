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

/** V2: los tres estados de una skill de organización. */
export type SkillStatus = 'draft' | 'active' | 'archived';

/** V3/A-5: tipo de incremento semántico de una publicación. */
export type SkillBump = 'initial' | 'major' | 'minor' | 'patch';

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
  /** V2: `draft` | `active` | `archived` (solo en skills de org). */
  status?: SkillStatus;
  /** A-3: contador entero de la #57 («obsoleto»); el panel NO lo usa. */
  version?: number;
  /** V7/A-3: versión publicada vigente (semver) o null si nunca se publicó. */
  current_version?: string | null;
  /** A-4: la copia de trabajo difiere de la versión vigente. */
  has_unpublished_changes?: boolean;
  /** A-3: tools de la versión vigente, o null si no hay. */
  published_tools?: string[] | null;
  created_at?: string;
  updated_at?: string;
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
  status?: SkillStatus;
  instructions?: string;
  current_version?: string | null;
  has_unpublished_changes?: boolean;
  published_tools?: string[] | null;
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

/**
 * A-5 — `GET /skills/:name/publish-preview`: la vista previa del diálogo de publicar.
 * `agents_on_latest` cuenta los agentes que usan la skill en primer lugar sin versión
 * fijada (aviso MAJOR de V7).
 */
export interface PublishPreview {
  next_version: string;
  bump: SkillBump;
  added_tools: string[];
  removed_tools: string[];
  agents_on_latest: number;
}

export async function getPublishPreview(name: string): Promise<PublishPreview> {
  return api.get<PublishPreview>(
    `/control/v1/skills/${encodeURIComponent(name)}/publish-preview`,
  );
}

export interface PublishInput {
  changelog?: string;
  /** A-5: la versión de la vista previa; si no coincide, 409 `publish_conflict`. */
  expected_version?: string;
}

export interface PublishResult extends SkillDetail {
  published_version: string;
  bump: SkillBump;
  changelog: string | null;
}

export async function publishOrgSkill(name: string, input: PublishInput): Promise<PublishResult> {
  return api.post<PublishResult>(`/control/v1/skills/${encodeURIComponent(name)}/publish`, input);
}

/**
 * V5/A-5 — una versión del historial (`GET /skills/:name/versions`). La API las
 * devuelve de la más nueva a la más vieja en orden semver; el panel respeta ese orden.
 */
export interface SkillVersionRecord {
  version: string;
  bump: SkillBump;
  display_name: string;
  description: string;
  instructions: string;
  allowed_tools: string[];
  base_skill: string;
  changelog: string | null;
  published_at: string;
  /** `published_by` llega de la API pero el panel NO lo muestra. */
  published_by: string | null;
}

export async function listSkillVersions(
  name: string,
): Promise<{ versions: SkillVersionRecord[]; total: number }> {
  return api.get<{ versions: SkillVersionRecord[]; total: number }>(
    `/control/v1/skills/${encodeURIComponent(name)}/versions`,
  );
}

/**
 * V8 — los selectores (alta y pestaña Skills) muestran solo las skills de RELT y las
 * de org `active`. Un `draft` no se puede asignar (V2) y una `archived` tampoco.
 *
 * Definido en `./skill-catalog` (los selectores lo importan de ahí, para que mockear
 * este módulo en los tests no lo desactive) y re-exportado aquí como superficie pública.
 */
export { selectableSkills, selectorTools } from './skill-catalog';


