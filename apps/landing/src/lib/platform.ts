import { api } from './api';
import type { TFunction } from '@/i18n/types';

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
  /** Las 6 condiciones del recorrido, tal como están HOY. */
  steps: Record<string, boolean>;
  /** Estado actual: el paso más alto con todos los anteriores cumplidos hoy. */
  lastStep: string;
  /**
   * Histórico: primera respuesta enviada alguna vez.
   * `firstReplySource` dice de dónde sale el dato (Orden #49 · E2):
   * `'link'` = por el vínculo ejecución → saliente; `'inferred'` = inferencia de la
   * #47 v2; `null` = sin respuesta.
   */
  firstReplyAt: string | null;
  firstReplySource: FirstReplySource;
}

export interface PlatformClientsOverview {
  generatedAt: string;
  /** La función tiene un tope duro de 500 organizaciones. */
  truncated: boolean;
  totalOrganizations: number;
  totals: {
    organizations: number;
    funnel: Record<string, number>;
    duplicates: number;
    legacyChannels: number;
  };
  clients: PlatformClientRow[];
}

/** Identificadores del recorrido tal como los devuelve la API (claves del `steps`). */
export const LAST_STEPS = [
  'registrada',
  'sandbox listo',
  'número conectado',
  'agente creado',
  'canal con agente',
  'primera respuesta',
] as const;

/**
 * Orden #62 · ANEXO-62-A (D2): el panel no muestra el texto del backend; mapea cada
 * identificador de paso a su clave del catálogo.
 */
const STEP_KEYS: Record<string, string> = {
  registrada: 'platform.step.registrada',
  'sandbox listo': 'platform.step.sandboxReady',
  'número conectado': 'platform.step.numberConnected',
  'agente creado': 'platform.step.agentCreated',
  'canal con agente': 'platform.step.channelWithAgent',
  'primera respuesta': 'platform.step.firstReply',
};

/**
 * K1 (Orden #48) · El sexto paso es una INFERENCIA, no un hecho: el esquema no
 * guarda qué ejecución generó cada mensaje saliente. Puede dar falsos negativos
 * y también falsos positivos (p. ej. un saliente de un operador en esa hora).
 *
 * Orden #49 · E2: cuando el dato viene del VÍNCULO (`first_reply_source = 'link'`),
 * deja de ser una inferencia y el rótulo pierde «(inferida)».
 */
export const FIRST_REPLY_STEP = 'primera respuesta';

/** Origen del dato de «primera respuesta» (Orden #49 · E2). */
export type FirstReplySource = 'link' | 'inferred' | null;

/** Claves de las reglas (K1 y D6/E2) en el catálogo. */
export const FIRST_REPLY_RULE_KEY = 'platform.firstReply.rule';
export const FIRST_REPLY_LINK_RULE_KEY = 'platform.firstReply.linkRule';

/**
 * Rótulo visible de un paso, en el idioma activo. El sexto se rotula «primera
 * respuesta (inferida)» salvo que el dato venga del vínculo.
 */
export function stepLabel(t: TFunction, step: string, source?: FirstReplySource): string {
  if (step === FIRST_REPLY_STEP) {
    return source === 'link'
      ? t('platform.step.firstReply')
      : t('platform.step.firstReplyInferred');
  }
  const key = STEP_KEYS[step];
  return key ? t(key) : step;
}

/** Rótulo del dato histórico de primera respuesta. */
export function firstReplyLabel(t: TFunction, source?: FirstReplySource): string {
  return source === 'link'
    ? t('platform.step.firstReply')
    : t('platform.step.firstReplyInferred');
}

/** Regla que se muestra junto al dato histórico, según su origen. */
export function firstReplyRule(t: TFunction, source?: FirstReplySource): string {
  return t(source === 'link' ? FIRST_REPLY_LINK_RULE_KEY : FIRST_REPLY_RULE_KEY);
}

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
