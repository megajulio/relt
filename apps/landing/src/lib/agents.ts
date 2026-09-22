import { api } from './api';

// === Contratos alineados con AgentConfigurationSchema (backend) ===
// SkillBinding: { skill, version }
// ToolBindings: string[]
// Memory: { shortTerm, summary }

interface BackendChannelBinding {
  id: string;
  phone_number_id: string;
  phone_number: string;
  is_default: boolean;
  status: string;
  created_at: string;
}

interface BackendAgent {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  defaultSkill: string;
  config: {
    maxSteps?: number;
    systemPrompt?: string;
    modelStrategy?: 'dual' | 'single';
    reasoningModel?: string;
    responseModel?: string;
    tone?: 'proactive' | 'reactive' | 'neutral' | 'formal';
    skillBinding?: { skill: string; version?: string };
    toolBindings?: string[];
    memory?: { shortTerm?: { enabled?: boolean; limit?: number }; summary?: { enabled?: boolean } };
  };
  createdAt: string;
  updatedAt: string;
  bindings?: BackendChannelBinding[];
}

interface BackendListResponse {
  agents: BackendAgent[];
  total: number;
}

// --- Contratos públicos ---
export interface SkillBinding {
  skill: string;
  version?: string;
}

export interface MemoryConfiguration {
  shortTerm?: { enabled?: boolean; limit?: number };
  summary?: { enabled?: boolean };
}

export interface AgentConfig {
  maxSteps?: number;
  systemPrompt?: string;
  modelStrategy?: 'dual' | 'single';
  reasoningModel?: string;
  responseModel?: string;
  tone?: 'proactive' | 'reactive' | 'neutral' | 'formal';
  skillBinding?: SkillBinding;
  toolBindings?: string[];
  memory?: MemoryConfiguration;
}

export interface ChannelBinding {
  id: string;
  phoneNumberId: string;
  phoneNumber: string;
  isDefault: boolean;
  status: string;
  createdAt: string;
}

export interface Agent {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  defaultSkill: string;
  config: AgentConfig;
  createdAt: string;
  updatedAt: string;
}

export interface AgentDetail extends Agent {
  bindings: ChannelBinding[];
}

function toChannelBinding(b: BackendChannelBinding): ChannelBinding {
  return {
    id: b.id,
    phoneNumberId: b.phone_number_id,
    phoneNumber: b.phone_number,
    isDefault: b.is_default,
    status: b.status,
    createdAt: b.created_at,
  };
}

function toAgent(b: BackendAgent): Agent {
  return {
    id: b.id,
    organizationId: b.organizationId,
    key: b.key,
    name: b.name,
    status: b.status,
    defaultSkill: b.defaultSkill,
    config: {
      maxSteps: b.config.maxSteps,
      systemPrompt: b.config.systemPrompt,
      modelStrategy: b.config.modelStrategy,
      reasoningModel: b.config.reasoningModel,
      responseModel: b.config.responseModel,
      tone: b.config.tone,
      skillBinding: b.config.skillBinding,
      toolBindings: b.config.toolBindings,
      memory: b.config.memory,
    },
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export async function listAgents(): Promise<Agent[]> {
  const response = await api.get<BackendListResponse>('/control/v1/agents');
  return response.agents.map(toAgent);
}

export async function getAgent(id: string): Promise<AgentDetail> {
  const response = await api.get<BackendAgent>(`/control/v1/agents/${id}`);
  return {
    ...toAgent(response),
    bindings: (response.bindings ?? []).map(toChannelBinding),
  };
}

export interface AgentConfigPatch {
  maxSteps?: number | null;
  systemPrompt?: string;
  modelStrategy?: 'dual' | 'single';
  reasoningModel?: string;
  responseModel?: string;
  tone?: 'proactive' | 'reactive' | 'neutral' | 'formal';
  skillBinding?: { skill: string; version?: string };
  toolBindings?: string[];
  memory?: {
    shortTerm?: { enabled?: boolean; limit?: number };
    summary?: { enabled?: boolean };
  };
}

export async function patchAgentConfig(id: string, patch: AgentConfigPatch): Promise<void> {
  await api.patch(`/control/v1/agents/${id}/config`, patch);
}


// --- F.9.4: Catálogos reales del Control Plane ---
export interface SkillCatalogItem {
  name: string;
  latestVersion: string;
  description: string;
  toolsCount: number;
  permissions: string[];
  triggers: string[];
}

export interface ToolCatalogItem {
  name: string;
  description: string;
  permissions: string[];
}

interface BackendSkillCatalogItem {
  name: string;
  latest_version: string;
  description: string;
  tools_count: number;
  permissions: string[];
  triggers: string[];
}

export async function listSkills(): Promise<SkillCatalogItem[]> {
  const res = await api.get<{ skills: BackendSkillCatalogItem[]; total: number }>('/control/v1/skills');
  return res.skills.map((s) => ({
    name: s.name,
    latestVersion: s.latest_version,
    description: s.description,
    toolsCount: s.tools_count,
    permissions: s.permissions,
    triggers: s.triggers,
  }));
}

export async function listTools(): Promise<ToolCatalogItem[]> {
  const res = await api.get<{ tools: ToolCatalogItem[] }>('/control/v1/tools');
  return res.tools;
}


// --- F.9.6: Phone Numbers Catalog + Channel Mutations ---
export interface PhoneNumberCatalogItem {
  id: string;
  phoneNumber: string;
  status: string;
  provider: string;
}

interface BackendPhoneNumberCatalogItem {
  id: string;
  phone_number: string;
  status: string;
  provider: string;
}

export async function listPhoneNumbers(): Promise<PhoneNumberCatalogItem[]> {
  const res = await api.get<{ phoneNumbers: BackendPhoneNumberCatalogItem[]; total: number }>(
    '/control/v1/phone-numbers'
  );
  return res.phoneNumbers.map((p) => ({
    id: p.id,
    phoneNumber: p.phone_number,
    status: p.status,
    provider: p.provider,
  }));
}

export async function assignChannel(
  agentId: string,
  phoneNumberId: string,
  isDefault: boolean
): Promise<void> {
  await api.post(`/control/v1/agents/${agentId}/bindings`, { phoneNumberId, isDefault });
}

export async function unassignChannel(agentId: string, bindingId: string): Promise<void> {
  await api.request<void>(`/control/v1/agents/${agentId}/bindings/${bindingId}`, {
    method: 'DELETE',
  });
}


// --- F.9.7: Agent Status Control ---
export async function updateAgentStatus(
  agentId: string,
  status: 'active' | 'paused' | 'archived'
): Promise<void> {
  await api.request<void>(`/control/v1/agents/${agentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// --- I: Create + UpdateStatus ---

export interface CreateAgentInput {
  key: string;
  name: string;
  defaultSkill?: string;
  status?: 'active' | 'paused' | 'archived';
  config?: AgentConfig;
}

export async function createAgent(input: CreateAgentInput): Promise<Agent> {
  const response = await api.post<BackendAgent>('/control/v1/agents', input);
  return toAgent(response);
}

