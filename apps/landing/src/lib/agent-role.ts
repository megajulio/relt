import { useDashboardAuth } from '@/components/dashboard/DashboardAuthProvider';

/**
 * ORDEN-68 · Bloque 2 · R3 / A-6 — quién puede editar agentes en el panel.
 *
 * El rol sale de `/auth/me` (`data.organizations[0].role`, el mismo
 * `organizations[0]` del layout, `app/dashboard/layout.tsx:82`). Es la MISMA
 * organización que resuelve el backend en las llamadas de agentes: `lib/api.ts`
 * no manda `X-Org-Id`, y `dashboardAuth` resuelve la primera membresía
 * `ORDER BY om.created_at ASC LIMIT 1`
 * (`src/control/middleware/dashboard-auth.middleware.ts:64-71`), el mismo orden
 * que `getCurrentUser` para `/auth/me`
 * (`src/control/services/auth.service.ts:278-285`).
 *
 * - `member` y `viewer` → SOLO LECTURA.
 * - `owner` y `admin` → como hoy.
 * - rol DESCONOCIDO (no cargó o falló `/me`) → el panel se comporta como hoy:
 *   decide el backend y un 403 se atiende con el aviso (`isRoleForbidden`).
 */
export type AgentAccess = {
  role: string | null;
  /** `true` solo si el rol es uno de los cuatro de la jerarquía. */
  known: boolean;
  readOnly: boolean;
};

const KNOWN_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;

export function agentAccessFromRole(role: string | null | undefined): AgentAccess {
  const normalized = typeof role === 'string' && role.length > 0 ? role.toLowerCase() : null;
  const known = normalized !== null && (KNOWN_ROLES as readonly string[]).includes(normalized);
  return {
    role: normalized,
    known,
    readOnly: known && (normalized === 'member' || normalized === 'viewer'),
  };
}

export function useAgentAccess(): AgentAccess {
  // Sin `DashboardAuthProvider` no hay `/me` que leer: el rol es DESCONOCIDO y
  // el panel se comporta como hoy (A-6). Varios tests montan los formularios
  // sueltos, sin el proveedor de sesión.
  try {
    const context = useDashboardAuth();
    const role = context?.data?.organizations?.[0]?.role ?? null;
    return agentAccessFromRole(role);
  } catch {
    return agentAccessFromRole(null);
  }
}

/** Un 403 de la guarda de rol (R1): el backend manda `insufficient-role`. */
export function isRoleForbidden(error: unknown): boolean {
  return (error as { status?: number } | undefined)?.status === 403;
}
