import { api } from './api';

/**
 * ORDEN-65 · Bloque 2 (ANEXO-65-B · A-6) — catálogo de tools de SOLO LECTURA.
 *
 * `GET /control/v1/tools/overview` (contrato del Bloque 1): por cada tool del
 * registry, ordenadas por `name`. `allowed` es «tu negocio tiene todos los
 * permisos que pide la tool»; el gate completo (agente, estado y skill) no es
 * de esta pantalla. `permitted` de cada skill usa los permisos de su skill base.
 */

export type ToolAccess = 'read' | 'write';

export interface ToolOverviewSkill {
  name: string;
  display_name: string;
  kind: 'repo' | 'org';
  permitted: boolean;
}

export interface ToolOverviewItem {
  name: string;
  access: ToolAccess;
  required_permissions: string[];
  allowed: boolean;
  missing_permissions: string[];
  skills: ToolOverviewSkill[];
}

/** El `GET` viejo (`/control/v1/tools`) no cambia; este es el de la pantalla nueva. */
export async function getToolsOverview(): Promise<ToolOverviewItem[]> {
  const response = await api.get<{ tools: ToolOverviewItem[] }>('/control/v1/tools/overview');
  return response.tools;
}
