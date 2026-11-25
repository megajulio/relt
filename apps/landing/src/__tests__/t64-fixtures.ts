/**
 * Orden #64 · ANEXO-64-F (F-3, M14) — fábrica ÚNICA de dobles con la forma EXACTA del
 * contrato del Bloque 1 (leído con `git show bc1b3f8:`; ver `64/b2-contrato.txt`).
 *
 * Clave: la LISTA de una skill de org (`orgListItem`, skill-control.service.ts:293-313)
 * NO trae `instructions`; el DETALLE (`getByNameForOrg`, 336-363) SÍ. El `PATCH` y el
 * `POST …/publish` responden con el DETALLE (routes/skills.route.ts:143-185).
 */

export type OrgStatus = 'draft' | 'active' | 'archived';
export type Bump = 'initial' | 'major' | 'minor' | 'patch';

export interface RepoSkillListItem {
  name: string;
  latest_version: string;
  description: string;
  tools_count: number;
  permissions: string[];
  triggers: string[];
  kind: 'repo';
  tools: string[];
}

export interface OrgSkillListItem {
  kind: 'org';
  name: string;
  display_name: string;
  description: string;
  base_skill: string;
  latest_version: string;
  version: number;
  status: OrgStatus;
  current_version: string | null;
  has_unpublished_changes: boolean;
  published_tools: string[] | null;
  tools_count: number;
  allowed_tools: string[];
  permissions: string[];
  triggers: string[];
  created_at: string;
  updated_at: string;
  /** `tools` lo deriva el panel del listado (no viene en `orgListItem`). */
  tools: string[];
}

export interface SkillVersionItem {
  version: string;
  description: string;
  permissions: string[];
  tools: string[];
  triggers: string[];
  instructions: string;
}

export interface SkillDetailFixture {
  kind: 'org';
  name: string;
  display_name: string;
  description: string;
  base_skill: string;
  status: OrgStatus;
  latest_version: string;
  current_version: string | null;
  has_unpublished_changes: boolean;
  published_tools: string[] | null;
  allowed_tools: string[];
  instructions: string;
  created_at: string;
  updated_at: string;
  versions: SkillVersionItem[];
}

export interface VersionRecordFixture {
  version: string;
  bump: Bump;
  display_name: string;
  description: string;
  instructions: string;
  allowed_tools: string[];
  base_skill: string;
  changelog: string | null;
  published_at: string;
  published_by: string | null;
}

export interface PublishPreviewFixture {
  next_version: string;
  bump: Bump;
  added_tools: string[];
  removed_tools: string[];
  agents_on_latest: number;
}

const DEFAULT_TOOLS = ['products.search'];

export function repoSkill(over: Partial<RepoSkillListItem> = {}): RepoSkillListItem {
  return {
    name: 'general',
    latest_version: '1.0.0',
    description: 'General',
    tools_count: 1,
    permissions: ['products:read'],
    triggers: [],
    kind: 'repo',
    tools: DEFAULT_TOOLS,
    ...over,
  };
}

/** Una skill de org tal como la devuelve la LISTA (sin `instructions`). */
export function orgSkill(over: Partial<OrgSkillListItem> = {}): OrgSkillListItem {
  const allowed = over.allowed_tools ?? DEFAULT_TOOLS;
  return {
    kind: 'org',
    name: 'tienda',
    display_name: 'Tienda',
    description: 'Tienda',
    base_skill: 'general',
    latest_version: '3',
    version: 3,
    status: 'active',
    current_version: '1.2.0',
    has_unpublished_changes: false,
    permissions: ['products:read'],
    triggers: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...over,
    // Derivados (salvo que el test los fije a mano):
    allowed_tools: allowed,
    published_tools: 'published_tools' in over ? (over.published_tools ?? null) : allowed,
    tools_count: over.tools_count ?? allowed.length,
    tools: over.tools ?? allowed,
  };
}

/** El DETALLE de una skill de org (`GET …/:name`), con `instructions` y `versions`. */
export function skillDetail(over: Partial<SkillDetailFixture> = {}): SkillDetailFixture {
  const allowed = over.allowed_tools ?? DEFAULT_TOOLS;
  const instructions = over.instructions ?? 'Pasos de la tienda';
  return {
    kind: 'org',
    name: 'tienda',
    display_name: 'Tienda',
    description: 'Tienda',
    base_skill: 'general',
    status: 'active',
    latest_version: '3',
    current_version: '1.2.0',
    has_unpublished_changes: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...over,
    allowed_tools: allowed,
    published_tools: 'published_tools' in over ? (over.published_tools ?? null) : allowed,
    instructions,
    versions: over.versions ?? [
      {
        version: '3',
        description: 'Tienda',
        permissions: ['products:read'],
        tools: allowed,
        triggers: [],
        instructions,
      },
    ],
  };
}

export function publishPreview(over: Partial<PublishPreviewFixture> = {}): PublishPreviewFixture {
  return {
    next_version: '1.3.0',
    bump: 'minor',
    added_tools: [],
    removed_tools: [],
    agents_on_latest: 0,
    ...over,
  };
}

/** Una versión del historial (`GET …/versions`). */
export function versionRecord(over: Partial<VersionRecordFixture> = {}): VersionRecordFixture {
  return {
    version: '1.0.0',
    bump: 'initial',
    display_name: 'Tienda',
    description: 'Tienda',
    instructions: 'Pasos',
    allowed_tools: DEFAULT_TOOLS,
    base_skill: 'general',
    changelog: null,
    published_at: '2026-01-01T00:00:00Z',
    published_by: null,
    ...over,
  };
}
