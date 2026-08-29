import { api } from './api';

// --- Contratos del backend (snake_case) ---
interface BackendApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

interface BackendCreateResponse extends BackendApiKey {
  key: string; // Solo en POST, nunca en GET
}

// --- Contratos públicos del frontend (camelCase) ---
export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface CreateApiKeyResponse extends ApiKey {
  /**
   * SOLO existe inmediatamente después de crearla.
   * Nunca volverá a ser mostrada. El usuario debe guardarla.
   */
  key: string;
}

// --- Transformaciones ---
function toApiKey(b: BackendApiKey): ApiKey {
  return {
    id: b.id,
    name: b.name,
    keyPrefix: b.key_prefix,
    scopes: b.scopes,
    isActive: b.is_active,
    createdAt: b.created_at,
    lastUsedAt: b.last_used_at,
  };
}

// --- API pública ---
export async function listApiKeys(): Promise<ApiKey[]> {
  const response = await api.get<{ data: BackendApiKey[] }>('/control/v1/api-keys');
  return response.data.map(toApiKey);
}

export async function createApiKey(
  name: string,
  environment: 'live' | 'test' = 'live'
): Promise<CreateApiKeyResponse> {
  const response = await api.post<BackendCreateResponse>('/control/v1/api-keys', {
    name,
    environment,
  });
  return { ...toApiKey(response), key: response.key };
}

export async function revokeApiKey(id: string): Promise<void> {
  await api.post(`/control/v1/api-keys/${id}/revoke`, {});
}
