import { api } from './api';

/**
 * Orden #47 · Cliente del panel interno del dueño (SOLO LECTURA).
 * Todos los endpoints son GET; ninguno escribe.
 */

export interface PlatformClientNumber {
  masked: string;
  provider: string | null;
  status: string | null;
  hasActiveBinding: boolean;
  duplicateWith: string[] | null;
}

export interface PlatformClientRow {
  organizationId: string;
  organizationName: string;
  organizationCreatedAt: string | null;
  ownerEmail: string | null;
  plan: string;
  trialStartedAt: string | null;
  trialExpiresAt: string | null;
  sandbox: {
    status: string | null;
    attempts: number;
    lastErrorCode: string | null;
    instanceName: string | null;
  };
  agents: { total: number; active: number };
  numbers: PlatformClientNumber[];
  activity: {
    firstInboundAt: string | null;
    lastInboundAt: string | null;
    inbound7d: number;
    executions7d: number;
    executionsFailed7d: number;
    inboxFailed: number;
    inboxReceivedOver1h: number;
  };
  lastStep: string;
}

export interface PlatformClientsOverview {
  generatedAt: string;
  totals: {
    organizations: number;
    funnel: Record<string, number>;
    duplicates: number;
    legacyChannels: number;
  };
  clients: PlatformClientRow[];
}

export const LAST_STEPS = [
  'registrada',
  'sandbox listo',
  'número conectado',
  'agente creado',
  'canal con agente',
  'primera respuesta',
] as const;

/** ¿La sesión actual es de un administrador de plataforma? */
export async function isPlatformAdmin(): Promise<boolean> {
  try {
    await api.get<{ isPlatformAdmin: boolean }>('/control/v1/platform/access');
    return true;
  } catch {
    return false;
  }
}

export async function getPlatformClients(): Promise<PlatformClientsOverview> {
  return api.get<PlatformClientsOverview>('/control/v1/platform/clients');
}
